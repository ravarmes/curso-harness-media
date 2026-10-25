import type { DatabaseSync } from 'node:sqlite';

export type Paciente = { id: number; nome: string; telefone: string; email: string | null };

export function criarRepositorioPacientes(banco: DatabaseSync) {
  banco.exec(`CREATE TABLE IF NOT EXISTS pacientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT
  )`);
  return {
    inserir(dados: Omit<Paciente, 'id'>): Paciente {
      const { lastInsertRowid } = banco
        .prepare('INSERT INTO pacientes (nome, telefone, email) VALUES (?, ?, ?)')
        .run(dados.nome, dados.telefone, dados.email);
      return { id: Number(lastInsertRowid), ...dados };
    },
    listar(): Paciente[] {
      return banco.prepare('SELECT * FROM pacientes ORDER BY nome, id').all().map((l) => ({ ...l }) as Paciente);
    },
    buscar(id: number): Paciente | undefined {
      const linha = banco.prepare('SELECT * FROM pacientes WHERE id = ?').get(id);
      return linha && ({ ...linha } as Paciente);
    },
  };
}

export type RepositorioPacientes = ReturnType<typeof criarRepositorioPacientes>;
