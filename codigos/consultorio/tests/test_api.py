from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.whatsapp import LogSender


@pytest.fixture
def ctx(tmp_path):
    sender = LogSender()
    app = create_app(str(tmp_path / "t.db"), sender=sender, iniciar_agendador=False)
    c = TestClient(app)
    pac = c.post("/pacientes", json={"nome": "Ana", "telefone": "+55 11 99999-8888"}).json()
    pro = c.post("/profissionais", json={"nome": "Dr. Bruno", "especialidade": "Clínico"}).json()
    return c, app, sender, pac, pro


def em(horas):
    return (datetime.now(timezone.utc) + timedelta(hours=horas)).isoformat()


def agendar(c, pac, pro, horas, dur=30):
    return c.post("/consultas", json={"paciente_id": pac["id"], "profissional_id": pro["id"],
                                      "inicio": em(horas), "duracao_min": dur})


def test_cadastros(ctx):
    c, _, _, pac, pro = ctx
    assert pac["telefone"] == "+5511999998888"
    assert c.get(f"/pacientes/{pac['id']}").json()["nome"] == "Ana"
    assert len(c.get("/profissionais").json()) == 1
    assert c.post("/pacientes", json={"nome": "X", "telefone": "123"}).status_code == 422
    assert c.get("/pacientes/999").status_code == 404


def test_agenda_e_conflito(ctx):
    c, _, _, pac, pro = ctx
    assert agendar(c, pac, pro, 72).status_code == 201
    assert agendar(c, pac, pro, 72).status_code == 409                # mesmo horário
    assert agendar(c, pac, pro, 72.25).status_code == 409             # sobreposição parcial
    assert agendar(c, pac, pro, 72.5).status_code == 201              # encostando é permitido
    outro = c.post("/profissionais", json={"nome": "Dra. C", "especialidade": "Pele"}).json()
    assert agendar(c, pac, outro, 72).status_code == 201              # outro profissional ok


def test_horario_liberado_apos_cancelar(ctx):
    c, _, _, pac, pro = ctx
    cid = agendar(c, pac, pro, 72).json()["id"]
    assert c.post(f"/consultas/{cid}/cancelar").status_code == 200
    assert agendar(c, pac, pro, 72).status_code == 201


def test_nao_agenda_no_passado_nem_ids_invalidos(ctx):
    c, _, _, pac, pro = ctx
    assert agendar(c, pac, pro, -1).status_code == 422
    assert c.post("/consultas", json={"paciente_id": 99, "profissional_id": pro["id"], "inicio": em(48)}).status_code == 404


def test_cancelamento_24h(ctx):
    c, _, _, pac, pro = ctx
    longe = agendar(c, pac, pro, 25).json()["id"]
    perto = agendar(c, pac, pro, 23).json()["id"]
    assert c.post(f"/consultas/{longe}/cancelar").json()["status"] == "cancelada"
    assert c.post(f"/consultas/{longe}/cancelar").status_code == 409  # já cancelada
    r = c.post(f"/consultas/{perto}/cancelar")
    assert r.status_code == 409 and "24 horas" in r.json()["detail"]
    assert c.get(f"/consultas/{perto}").json()["status"] == "agendada"


def test_lembrete_uma_vez_so(ctx):
    c, _, sender, pac, pro = ctx
    agendar(c, pac, pro, 20)    # dentro da janela de 24h
    agendar(c, pac, pro, 100)   # fora
    assert c.post("/lembretes/enviar").json() == {"enviados": 1}
    assert c.post("/lembretes/enviar").json() == {"enviados": 0}
    assert sender.enviadas[0][0] == "+5511999998888" and "Ana" in sender.enviadas[0][1]


def test_lembrete_ignora_cancelada(ctx):
    c, _, _, pac, pro = ctx
    cid = agendar(c, pac, pro, 100).json()["id"]
    c.post(f"/consultas/{cid}/cancelar")
    assert c.post("/lembretes/enviar").json() == {"enviados": 0}
