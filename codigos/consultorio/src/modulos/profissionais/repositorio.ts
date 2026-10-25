import type { DatabaseSync } from 'node:sqlite';

export type Profissional = { id: number; nome: string; especialidade: string };
// Dia da semana: 0 = segunda ... 6 = domingo. Horários em minutos desde 00:00, de Brasília.
export type FaixaDeExpediente = { dia_semana: number; inicio_min: number; fim_min: number };

export function criarRepositorioProfissionais(banco: DatabaseSync) {
  banco.exec(`
    CREATE TABLE IF NOT EXISTS profissionais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      especialidade TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS expediente (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profissional_id INTEGER NOT NULL REFERENCES profissionais(id),
      dia_semana INTEGER NOT NULL,
      inicio_min INTEGER NOT NULL,
      fim_min INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_expediente_profissional ON expediente (profissional_id, dia_semana);
  `);
  return {
    inserir(dados: Omit<Profissional, 'id'>): Profissional {
      const { lastInsertRowid } = banco
        .prepare('INSERT INTO profissionais (nome, especialidade) VALUES (?, ?)')
        .run(dados.nome, dados.especialidade);
      return { id: Number(lastInsertRowid), ...dados };
    },
    listar(): Profissional[] {
      return banco.prepare('SELECT * FROM profissionais ORDER BY nome, id').all().map((l) => ({ ...l }) as Profissional);
    },
    buscar(id: number): Profissional | undefined {
      const linha = banco.prepare('SELECT * FROM profissionais WHERE id = ?').get(id);
      return linha && ({ ...linha } as Profissional);
    },
    expediente(profissionalId: number): FaixaDeExpediente[] {
      return banco
        .prepare(
          `SELECT dia_semana, inicio_min, fim_min FROM expediente
           WHERE profissional_id = ? ORDER BY dia_semana, inicio_min`,
        )
        .all(profissionalId)
        .map((l) => ({ ...l }) as FaixaDeExpediente);
    },
    // Troca o expediente inteiro, tudo ou nada.
    substituirExpediente(profissionalId: number, faixas: FaixaDeExpediente[]): void {
      banco.exec('BEGIN IMMEDIATE');
      try {
        banco.prepare('DELETE FROM expediente WHERE profissional_id = ?').run(profissionalId);
        const inserir = banco.prepare(
          'INSERT INTO expediente (profissional_id, dia_semana, inicio_min, fim_min) VALUES (?, ?, ?, ?)',
        );
        for (const f of faixas) inserir.run(profissionalId, f.dia_semana, f.inicio_min, f.fim_min);
        banco.exec('COMMIT');
      } catch (erro) {
        banco.exec('ROLLBACK');
        throw erro;
      }
    },
  };
}

export type RepositorioProfissionais = ReturnType<typeof criarRepositorioProfissionais>;
