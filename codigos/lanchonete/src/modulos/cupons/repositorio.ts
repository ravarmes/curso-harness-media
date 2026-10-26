import type { DatabaseSync } from 'node:sqlite';

// Acesso ao banco do módulo. Só o index.ts do módulo o entrega às fatias.
export type Cupom = { id: number; codigo: string; percentual: number };

// As linhas do SQLite têm protótipo nulo; o cupom sai como objeto comum.
const paraCupom = ({ id, codigo, percentual }: Cupom): Cupom => ({ id, codigo, percentual });

// O código chega já normalizado (aparado e em maiúsculas) pelas fatias.
export function criarRepositorioDosCupons(banco: DatabaseSync) {
  banco.exec(
    'CREATE TABLE IF NOT EXISTS cupons (id INTEGER PRIMARY KEY, codigo TEXT NOT NULL UNIQUE, percentual INTEGER NOT NULL)',
  );
  return {
    existeCodigo(codigo: string): boolean {
      return banco.prepare('SELECT 1 FROM cupons WHERE codigo = ?').get(codigo) !== undefined;
    },
    inserir(codigo: string, percentual: number): Cupom {
      const resultado = banco.prepare('INSERT INTO cupons (codigo, percentual) VALUES (?, ?)').run(codigo, percentual);
      return { id: Number(resultado.lastInsertRowid), codigo, percentual };
    },
    buscarPorCodigo(codigo: string): Cupom | undefined {
      const linha = banco.prepare('SELECT id, codigo, percentual FROM cupons WHERE codigo = ?').get(codigo) as
        Cupom | undefined;
      return linha && paraCupom(linha);
    },
  };
}

export type RepositorioDosCupons = ReturnType<typeof criarRepositorioDosCupons>;
