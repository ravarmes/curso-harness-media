import type { DatabaseSync } from 'node:sqlite';

// `data` é o dia de Brasília (AAAA-MM-DD); `entrou_em_utc` está no formato de toISOString().
// A ordem de chegada é a ordem do id.
export type Entrada = {
  id: number;
  paciente_id: number;
  profissional_id: number;
  data: string;
  entrou_em_utc: string;
};

export function criarRepositorioEspera(banco: DatabaseSync) {
  banco.exec(`
    CREATE TABLE IF NOT EXISTS lista_de_espera (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER NOT NULL,
      profissional_id INTEGER NOT NULL,
      data TEXT NOT NULL,
      entrou_em_utc TEXT NOT NULL,
      UNIQUE (paciente_id, profissional_id, data)
    );
    CREATE INDEX IF NOT EXISTS idx_espera_fila ON lista_de_espera (profissional_id, data, id);
  `);
  return {
    // O node:sqlite é síncrono: conferir e inserir, sem await no meio, não deixa outro pedido passar.
    inserir(dados: Omit<Entrada, 'id'>): Entrada {
      const { lastInsertRowid } = banco
        .prepare('INSERT INTO lista_de_espera (paciente_id, profissional_id, data, entrou_em_utc) VALUES (?, ?, ?, ?)')
        .run(dados.paciente_id, dados.profissional_id, dados.data, dados.entrou_em_utc);
      return { id: Number(lastInsertRowid), ...dados };
    },
    jaNaLista(pacienteId: number, profissionalId: number, data: string): boolean {
      return (
        banco
          .prepare('SELECT 1 FROM lista_de_espera WHERE paciente_id = ? AND profissional_id = ? AND data = ?')
          .get(pacienteId, profissionalId, data) !== undefined
      );
    },
    porId(id: number): Entrada | undefined {
      const linha = banco.prepare('SELECT * FROM lista_de_espera WHERE id = ?').get(id);
      return linha && ({ ...linha } as Entrada);
    },
    remover(id: number): void {
      banco.prepare('DELETE FROM lista_de_espera WHERE id = ?').run(id);
    },
    // A fila do profissional no dia, em ordem de chegada.
    daFila(profissionalId: number, data: string): Entrada[] {
      return banco
        .prepare('SELECT * FROM lista_de_espera WHERE profissional_id = ? AND data = ? ORDER BY id')
        .all(profissionalId, data)
        .map((l) => ({ ...l }) as Entrada);
    },
  };
}

export type RepositorioEspera = ReturnType<typeof criarRepositorioEspera>;
