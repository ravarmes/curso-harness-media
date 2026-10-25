import type { DatabaseSync } from 'node:sqlite';

// Instantes em UTC, no formato de toISOString(), que ordena como texto.
export type Consulta = { id: number; paciente_id: number; profissional_id: number; inicio_utc: string; fim_utc: string };

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
  // Intervalos [inicio, fim): consulta que começa quando outra termina não se sobrepõe.
  const sobrepoe = (coluna: 'profissional_id' | 'paciente_id') =>
    banco.prepare(`SELECT 1 FROM consultas WHERE ${coluna} = ? AND inicio_utc < ? AND fim_utc > ? LIMIT 1`);
  const doProfissional = sobrepoe('profissional_id');
  const doPaciente = sobrepoe('paciente_id');
  return {
    // O node:sqlite é síncrono: conferir e inserir, sem await no meio, não deixa outro pedido passar.
    inserir(dados: Omit<Consulta, 'id'>): Consulta {
      const { lastInsertRowid } = banco
        .prepare('INSERT INTO consultas (paciente_id, profissional_id, inicio_utc, fim_utc) VALUES (?, ?, ?, ?)')
        .run(dados.paciente_id, dados.profissional_id, dados.inicio_utc, dados.fim_utc);
      return { id: Number(lastInsertRowid), ...dados };
    },
    profissionalOcupado(id: number, inicioUtc: string, fimUtc: string): boolean {
      return doProfissional.get(id, fimUtc, inicioUtc) !== undefined;
    },
    pacienteOcupado(id: number, inicioUtc: string, fimUtc: string): boolean {
      return doPaciente.get(id, fimUtc, inicioUtc) !== undefined;
    },
    // Consultas que começam em [deDeUtc, ateUtc), em ordem.
    doProfissionalNoPeriodo(id: number, deUtc: string, ateUtc: string): Consulta[] {
      return banco
        .prepare(
          `SELECT * FROM consultas WHERE profissional_id = ? AND inicio_utc >= ? AND inicio_utc < ?
           ORDER BY inicio_utc, id`,
        )
        .all(id, deUtc, ateUtc)
        .map((l) => ({ ...l }) as Consulta);
    },
  };
}

export type RepositorioAgenda = ReturnType<typeof criarRepositorioAgenda>;
