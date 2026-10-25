import { DatabaseSync } from 'node:sqlite';

// SQLite embutido no Node, sem dependência. Os testes usam ':memory:'.
export function abrirBanco(caminho = process.env.BANCO ?? 'dados.sqlite'): DatabaseSync {
  return new DatabaseSync(caminho);
}
