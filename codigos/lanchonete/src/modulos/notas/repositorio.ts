import type { DatabaseSync } from 'node:sqlite';

// Acesso ao banco do módulo. Só o index.ts do módulo o entrega às fatias.
export type Nota = { id: number; texto: string };

export function criarRepositorioDeNotas(banco: DatabaseSync) {
  banco.exec('CREATE TABLE IF NOT EXISTS notas (id INTEGER PRIMARY KEY, texto TEXT NOT NULL)');
  return {
    inserir(texto: string): Nota {
      const resultado = banco.prepare('INSERT INTO notas (texto) VALUES (?)').run(texto);
      return { id: Number(resultado.lastInsertRowid), texto };
    },
    listar(): Nota[] {
      return banco.prepare('SELECT id, texto FROM notas ORDER BY id').all() as Nota[];
    },
  };
}

export type RepositorioDeNotas = ReturnType<typeof criarRepositorioDeNotas>;
