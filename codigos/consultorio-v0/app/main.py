import asyncio
import logging
import re
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field, field_validator

from .db import connect
from .whatsapp import sender_from_env

TZ_LOCAL = timezone(timedelta(hours=-3))  # horário de Brasília (sem horário de verão)
ANTECEDENCIA_CANCELAMENTO = timedelta(hours=24)
JANELA_LEMBRETE = timedelta(hours=24)  # lembrete sai quando faltam <= 24h
INTERVALO_LEMBRETES_S = 60

log = logging.getLogger("consultorio")


def agora() -> datetime:
    return datetime.now(timezone.utc)


def para_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=TZ_LOCAL)
    return dt.astimezone(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


# ---------- modelos ----------
class PacienteIn(BaseModel):
    nome: str = Field(min_length=1)
    telefone: str  # formato internacional, ex.: +5511999998888
    email: str | None = None

    @field_validator("telefone")
    @classmethod
    def valida_tel(cls, v):
        v = re.sub(r"[\s\-()]", "", v)
        if not re.fullmatch(r"\+\d{10,15}", v):
            raise ValueError("telefone deve estar no formato internacional, ex.: +5511999998888")
        return v


class ProfissionalIn(BaseModel):
    nome: str = Field(min_length=1)
    especialidade: str = Field(min_length=1)


def _hhmm_para_min(v: str) -> int:
    m = re.fullmatch(r"(\d{2}):(\d{2})", v)
    if not m:
        raise ValueError("horário deve estar no formato HH:MM")
    h, mi = int(m[1]), int(m[2])
    if mi > 59 or h > 24 or (h == 24 and mi != 0):
        raise ValueError("horário inválido")
    return h * 60 + mi


def _min_para_hhmm(m: int) -> str:
    return f"{m // 60:02d}:{m % 60:02d}"


class FaixaIn(BaseModel):
    dia_semana: int = Field(ge=0, le=6)  # 0 = segunda ... 6 = domingo
    inicio: str  # HH:MM, horário de Brasília
    fim: str  # HH:MM; "24:00" vale para o fim do dia

    @field_validator("inicio", "fim")
    @classmethod
    def valida_hora(cls, v):
        _hhmm_para_min(v)
        return v


class ExpedienteIn(BaseModel):
    faixas: list[FaixaIn]


class ConsultaIn(BaseModel):
    paciente_id: int
    profissional_id: int
    inicio: datetime  # sem fuso = horário de Brasília
    duracao_min: int = Field(default=30, gt=0, le=480)


def consulta_out(r) -> dict:
    d = dict(r)
    return d


# ---------- app ----------
def create_app(db_path: str | None = None, sender=None, iniciar_agendador: bool = True) -> FastAPI:
    conn = connect(db_path)
    sender = sender or sender_from_env()

    def enviar_lembretes() -> int:
        limite = iso(agora() + JANELA_LEMBRETE)
        rows = conn.execute(
            """SELECT c.id, c.inicio, p.nome AS paciente, p.telefone, pr.nome AS profissional
               FROM consultas c
               JOIN pacientes p ON p.id = c.paciente_id
               JOIN profissionais pr ON pr.id = c.profissional_id
               WHERE c.status = 'agendada' AND c.lembrete_enviado_em IS NULL
                 AND c.inicio > ? AND c.inicio <= ?""",
            (iso(agora()), limite),
        ).fetchall()
        enviados = 0
        for r in rows:
            quando = datetime.fromisoformat(r["inicio"]).astimezone(TZ_LOCAL)
            msg = (
                f"Olá, {r['paciente']}! Lembrete: sua consulta com {r['profissional']} é "
                f"amanhã, {quando:%d/%m} às {quando:%H:%M}. Cancelamentos só são aceitos "
                f"com 24h de antecedência."
            )
            try:
                sender.enviar(r["telefone"], msg)
            except Exception:
                log.exception("falha ao enviar lembrete da consulta %s", r["id"])
                continue  # tenta de novo no próximo ciclo
            conn.execute("UPDATE consultas SET lembrete_enviado_em = ? WHERE id = ?", (iso(agora()), r["id"]))
            enviados += 1
        return enviados

    async def loop_lembretes():
        while True:
            try:
                await asyncio.to_thread(enviar_lembretes)
            except Exception:
                log.exception("erro no agendador de lembretes")
            await asyncio.sleep(INTERVALO_LEMBRETES_S)

    @asynccontextmanager
    async def lifespan(_):
        task = asyncio.create_task(loop_lembretes()) if iniciar_agendador else None
        yield
        if task:
            task.cancel()

    app = FastAPI(title="Agenda do Consultório", lifespan=lifespan)
    app.state.enviar_lembretes = enviar_lembretes

    # --- pacientes ---
    @app.post("/pacientes", status_code=201)
    def criar_paciente(p: PacienteIn):
        cur = conn.execute("INSERT INTO pacientes(nome, telefone, email) VALUES (?,?,?)", (p.nome, p.telefone, p.email))
        return {"id": cur.lastrowid, **p.model_dump()}

    @app.get("/pacientes")
    def listar_pacientes():
        return [dict(r) for r in conn.execute("SELECT * FROM pacientes ORDER BY nome")]

    @app.get("/pacientes/{id}")
    def obter_paciente(id: int):
        r = conn.execute("SELECT * FROM pacientes WHERE id = ?", (id,)).fetchone()
        if not r:
            raise HTTPException(404, "Paciente não encontrado")
        return dict(r)

    # --- profissionais ---
    @app.post("/profissionais", status_code=201)
    def criar_profissional(p: ProfissionalIn):
        cur = conn.execute("INSERT INTO profissionais(nome, especialidade) VALUES (?,?)", (p.nome, p.especialidade))
        return {"id": cur.lastrowid, **p.model_dump()}

    @app.get("/profissionais")
    def listar_profissionais():
        return [dict(r) for r in conn.execute("SELECT * FROM profissionais ORDER BY nome")]

    @app.get("/profissionais/{id}")
    def obter_profissional(id: int):
        r = conn.execute("SELECT * FROM profissionais WHERE id = ?", (id,)).fetchone()
        if not r:
            raise HTTPException(404, "Profissional não encontrado")
        return dict(r)

    # --- expediente ---
    def faixas_do_dia(profissional_id: int, dia: int) -> list[tuple[int, int]]:
        rows = conn.execute(
            "SELECT inicio_min, fim_min FROM expediente WHERE profissional_id = ? AND dia_semana = ?",
            (profissional_id, dia),
        )
        return [(r["inicio_min"], r["fim_min"]) for r in rows]

    def dentro_do_expediente(profissional_id: int, inicio: datetime, fim: datetime) -> bool:
        """A consulta (que pode atravessar a meia-noite) precisa caber em faixas do expediente, dia a dia."""
        ini, fi = inicio.astimezone(TZ_LOCAL), fim.astimezone(TZ_LOCAL)
        dia = ini.date()
        while dia <= fi.date():
            a = ini.hour * 60 + ini.minute if dia == ini.date() else 0
            b = fi.hour * 60 + fi.minute if dia == fi.date() else 24 * 60
            if b > a and not any(fi_ <= a and b <= ff for fi_, ff in faixas_do_dia(profissional_id, dia.weekday())):
                return False
            dia += timedelta(days=1)
        return True

    def expediente_out(profissional_id: int) -> dict:
        rows = conn.execute(
            "SELECT dia_semana, inicio_min, fim_min FROM expediente WHERE profissional_id = ? "
            "ORDER BY dia_semana, inicio_min",
            (profissional_id,),
        )
        return {"faixas": [
            {"dia_semana": r["dia_semana"], "inicio": _min_para_hhmm(r["inicio_min"]), "fim": _min_para_hhmm(r["fim_min"])}
            for r in rows
        ]}

    @app.get("/profissionais/{id}/expediente")
    def obter_expediente(id: int):
        if not conn.execute("SELECT 1 FROM profissionais WHERE id = ?", (id,)).fetchone():
            raise HTTPException(404, "Profissional não encontrado")
        return expediente_out(id)

    @app.put("/profissionais/{id}/expediente")
    def definir_expediente(id: int, e: ExpedienteIn):
        """Substitui o expediente inteiro do profissional. Consultas já agendadas não são afetadas."""
        if not conn.execute("SELECT 1 FROM profissionais WHERE id = ?", (id,)).fetchone():
            raise HTTPException(404, "Profissional não encontrado")
        faixas = sorted((f.dia_semana, _hhmm_para_min(f.inicio), _hhmm_para_min(f.fim)) for f in e.faixas)
        for dia, ini, fim in faixas:
            if ini >= fim:
                raise HTTPException(422, "Em cada faixa, o início deve ser anterior ao fim")
        for (d1, _, f1), (d2, i2, _) in zip(faixas, faixas[1:]):
            if d1 == d2 and i2 < f1:
                raise HTTPException(422, "Faixas do mesmo dia não podem se sobrepor")
        conn.execute("BEGIN IMMEDIATE")
        try:
            conn.execute("DELETE FROM expediente WHERE profissional_id = ?", (id,))
            conn.executemany(
                "INSERT INTO expediente(profissional_id, dia_semana, inicio_min, fim_min) VALUES (?,?,?,?)",
                [(id, d, i, f) for d, i, f in faixas],
            )
            conn.execute("COMMIT")
        except Exception:
            conn.execute("ROLLBACK")
            raise
        return expediente_out(id)

    # --- consultas ---
    @app.post("/consultas", status_code=201)
    def agendar(c: ConsultaIn):
        inicio = para_utc(c.inicio)
        fim = inicio + timedelta(minutes=c.duracao_min)
        if inicio <= agora():
            raise HTTPException(422, "A consulta deve ser em um horário futuro")
        if not conn.execute("SELECT 1 FROM pacientes WHERE id = ?", (c.paciente_id,)).fetchone():
            raise HTTPException(404, "Paciente não encontrado")
        if not conn.execute("SELECT 1 FROM profissionais WHERE id = ?", (c.profissional_id,)).fetchone():
            raise HTTPException(404, "Profissional não encontrado")

        if not dentro_do_expediente(c.profissional_id, inicio, fim):
            raise HTTPException(409, "Horário fora do expediente do profissional")

        # BEGIN IMMEDIATE torna checagem + inserção atômicas (sem corrida entre requisições)
        conn.execute("BEGIN IMMEDIATE")
        try:
            conflito = conn.execute(
                """SELECT 1 FROM consultas
                   WHERE profissional_id = ? AND status = 'agendada' AND inicio < ? AND fim > ?""",
                (c.profissional_id, iso(fim), iso(inicio)),
            ).fetchone()
            if conflito:
                conn.execute("ROLLBACK")
                raise HTTPException(409, "Profissional já possui consulta neste horário")
            cur = conn.execute(
                "INSERT INTO consultas(paciente_id, profissional_id, inicio, fim) VALUES (?,?,?,?)",
                (c.paciente_id, c.profissional_id, iso(inicio), iso(fim)),
            )
            conn.execute("COMMIT")
        except HTTPException:
            raise
        except Exception:
            conn.execute("ROLLBACK")
            raise
        return consulta_out(conn.execute("SELECT * FROM consultas WHERE id = ?", (cur.lastrowid,)).fetchone())

    @app.get("/consultas")
    def listar_consultas(
        profissional_id: int | None = None,
        paciente_id: int | None = None,
        status: str | None = Query(None, pattern="^(agendada|cancelada)$"),
    ):
        sql, args = "SELECT * FROM consultas WHERE 1=1", []
        for col, val in (("profissional_id", profissional_id), ("paciente_id", paciente_id), ("status", status)):
            if val is not None:
                sql += f" AND {col} = ?"
                args.append(val)
        return [consulta_out(r) for r in conn.execute(sql + " ORDER BY inicio", args)]

    @app.get("/consultas/{id}")
    def obter_consulta(id: int):
        r = conn.execute("SELECT * FROM consultas WHERE id = ?", (id,)).fetchone()
        if not r:
            raise HTTPException(404, "Consulta não encontrada")
        return consulta_out(r)

    @app.post("/consultas/{id}/cancelar")
    def cancelar(id: int):
        r = conn.execute("SELECT * FROM consultas WHERE id = ?", (id,)).fetchone()
        if not r:
            raise HTTPException(404, "Consulta não encontrada")
        if r["status"] == "cancelada":
            raise HTTPException(409, "Consulta já cancelada")
        inicio = datetime.fromisoformat(r["inicio"])
        if agora() > inicio - ANTECEDENCIA_CANCELAMENTO:
            raise HTTPException(409, "Cancelamento só é permitido até 24 horas antes da consulta")
        conn.execute("UPDATE consultas SET status = 'cancelada' WHERE id = ?", (id,))
        return consulta_out(conn.execute("SELECT * FROM consultas WHERE id = ?", (id,)).fetchone())

    # --- lembretes (disparo manual, útil para testar) ---
    @app.post("/lembretes/enviar")
    def disparar_lembretes():
        return {"enviados": enviar_lembretes()}

    return app


app = create_app()
