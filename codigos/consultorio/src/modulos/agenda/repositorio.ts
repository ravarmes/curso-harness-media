import type { DatabaseSync } from 'node:sqlite';

// Instantes em UTC, no formato de toISOString(), que ordena como texto.
export type Consulta = {
  id: number;
  paciente_id: number;
  profissional_id: number;
  inicio_utc: string;
  fim_utc: string;
  status: 'agendada' | 'cancelada' | 'faltou';
};

export function criarRepositorioAgenda(banco: DatabaseSync) {
  banco.exec(`
    CREATE TABLE IF NOT EXISTS consultas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER NOT NULL,
      profissional_id INTEGER NOT NULL,
      inicio_utc TEXT NOT NULL,
      fim_utc TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_consultas_profissional ON consultas (profissional_id, inicio_utc);
    CREATE INDEX IF NOT EXISTS idx_consultas_paciente ON consultas (paciente_id, inicio_utc);
  `);
  // Bancos criados antes do cancelamento não têm a coluna.
  if (
    !banco
      .prepare('PRAGMA table_info(consultas)')
      .all()
      .some((c) => c.name === 'status')
  ) {
    banco.exec("ALTER TABLE consultas ADD COLUMN status TEXT NOT NULL DEFAULT 'agendada'");
  }
  // Intervalos [inicio, fim): consulta que começa quando outra termina não se sobrepõe.
  const sobrepoe = (coluna: 'profissional_id' | 'paciente_id') =>
    banco.prepare(
      `SELECT 1 FROM consultas WHERE ${coluna} = ? AND status = 'agendada' AND inicio_utc < ? AND fim_utc > ? AND id <> ? LIMIT 1`,
    );
  const doProfissional = sobrepoe('profissional_id');
  const doPaciente = sobrepoe('paciente_id');
  return {
    // O node:sqlite é síncrono: conferir e inserir, sem await no meio, não deixa outro pedido passar.
    inserir(dados: Omit<Consulta, 'id' | 'status'>): Consulta {
      const { lastInsertRowid } = banco
        .prepare('INSERT INTO consultas (paciente_id, profissional_id, inicio_utc, fim_utc) VALUES (?, ?, ?, ?)')
        .run(dados.paciente_id, dados.profissional_id, dados.inicio_utc, dados.fim_utc);
      return { id: Number(lastInsertRowid), ...dados, status: 'agendada' };
    },
    // `ignorar`: id de uma consulta que não conta (a que está sendo remarcada).
    profissionalOcupado(id: number, inicioUtc: string, fimUtc: string, ignorar = 0): boolean {
      return doProfissional.get(id, fimUtc, inicioUtc, ignorar) !== undefined;
    },
    pacienteOcupado(id: number, inicioUtc: string, fimUtc: string, ignorar = 0): boolean {
      return doPaciente.get(id, fimUtc, inicioUtc, ignorar) !== undefined;
    },
    porId(id: number): Consulta | undefined {
      const linha = banco.prepare('SELECT * FROM consultas WHERE id = ?').get(id);
      return linha && ({ ...linha } as Consulta);
    },
    cancelar(id: number): void {
      banco.prepare("UPDATE consultas SET status = 'cancelada' WHERE id = ?").run(id);
    },
    remarcar(id: number, inicioUtc: string, fimUtc: string): void {
      banco.prepare('UPDATE consultas SET inicio_utc = ?, fim_utc = ? WHERE id = ?').run(inicioUtc, fimUtc, id);
    },
    registrarFalta(id: number): void {
      banco.prepare("UPDATE consultas SET status = 'faltou' WHERE id = ?").run(id);
    },
    // Faltas do paciente em consultas que começam de `deUtc` em diante.
    faltasDoPaciente(id: number, deUtc: string): number {
      const linha = banco
        .prepare(
          "SELECT COUNT(*) AS total FROM consultas WHERE paciente_id = ? AND status = 'faltou' AND inicio_utc >= ?",
        )
        .get(id, deUtc);
      return Number(linha?.total);
    },
    // Consultas agendadas, de todos os profissionais, que começam em [deUtc, ateUtc), em ordem.
    noPeriodo(deUtc: string, ateUtc: string): Consulta[] {
      return banco
        .prepare(
          `SELECT * FROM consultas WHERE status = 'agendada' AND inicio_utc >= ? AND inicio_utc < ?
           ORDER BY inicio_utc, id`,
        )
        .all(deUtc, ateUtc)
        .map((l) => ({ ...l }) as Consulta);
    },
    // Consultas que começam em [deDeUtc, ateUtc), em ordem.
    doProfissionalNoPeriodo(id: number, deUtc: string, ateUtc: string): Consulta[] {
      return banco
        .prepare(
          `SELECT * FROM consultas WHERE profissional_id = ? AND status = 'agendada' AND inicio_utc >= ? AND inicio_utc < ?
           ORDER BY inicio_utc, id`,
        )
        .all(id, deUtc, ateUtc)
        .map((l) => ({ ...l }) as Consulta);
    },
    // Consultas que ocupam o horário (agendadas e faltas, sem canceladas) e começam em [deUtc, ateUtc).
    ocupadasDoProfissionalNoPeriodo(id: number, deUtc: string, ateUtc: string): Consulta[] {
      return banco
        .prepare(
          `SELECT * FROM consultas WHERE profissional_id = ? AND status IN ('agendada', 'faltou')
           AND inicio_utc >= ? AND inicio_utc < ? ORDER BY inicio_utc, id`,
        )
        .all(id, deUtc, ateUtc)
        .map((l) => ({ ...l }) as Consulta);
    },
  };
}

export type RepositorioAgenda = ReturnType<typeof criarRepositorioAgenda>;
