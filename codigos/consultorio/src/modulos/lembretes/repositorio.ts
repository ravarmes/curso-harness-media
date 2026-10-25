import type { DatabaseSync } from 'node:sqlite';

export type StatusDoLembrete = 'enviado' | 'falhou';

export function criarRepositorioLembretes(banco: DatabaseSync) {
  banco.exec(`CREATE TABLE IF NOT EXISTS lembretes (
    consulta_id INTEGER PRIMARY KEY,
    status TEXT NOT NULL,
    tentado_em TEXT NOT NULL
  )`);
  return {
    status(consultaId: number): StatusDoLembrete | undefined {
      const linha = banco.prepare('SELECT status FROM lembretes WHERE consulta_id = ?').get(consultaId);
      return linha && (linha.status as StatusDoLembrete);
    },
    registrar(consultaId: number, status: StatusDoLembrete, tentadoEmMs: number): void {
      banco
        .prepare(
          `INSERT INTO lembretes (consulta_id, status, tentado_em) VALUES (?, ?, ?)
           ON CONFLICT (consulta_id) DO UPDATE SET status = excluded.status, tentado_em = excluded.tentado_em`,
        )
        .run(consultaId, status, new Date(tentadoEmMs).toISOString());
    },
  };
}

export type RepositorioLembretes = ReturnType<typeof criarRepositorioLembretes>;
