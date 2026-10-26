import type { DatabaseSync } from 'node:sqlite';

// Acesso ao banco do módulo. Só o index.ts do módulo o entrega às fatias.
export type Bairro = { id: number; nome: string; taxa: number };

// A chave do nome ignora maiúsculas e minúsculas, inclusive com acento
// (o COLLATE NOCASE do SQLite só trata ASCII).
const chaveDoNome = (nome: string) => nome.toLocaleLowerCase('pt-BR');

// As linhas do SQLite têm protótipo nulo; o bairro sai como objeto comum.
const paraBairro = ({ id, nome, taxa }: Bairro): Bairro => ({ id, nome, taxa });

export function criarRepositorioDosBairros(banco: DatabaseSync) {
  banco.exec(
    'CREATE TABLE IF NOT EXISTS bairros (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, nome_chave TEXT NOT NULL UNIQUE, taxa INTEGER NOT NULL)',
  );
  return {
    existeNome(nome: string): boolean {
      return banco.prepare('SELECT 1 FROM bairros WHERE nome_chave = ?').get(chaveDoNome(nome)) !== undefined;
    },
    inserir(nome: string, taxa: number): Bairro {
      const resultado = banco
        .prepare('INSERT INTO bairros (nome, nome_chave, taxa) VALUES (?, ?, ?)')
        .run(nome, chaveDoNome(nome), taxa);
      return { id: Number(resultado.lastInsertRowid), nome, taxa };
    },
    listar(): Bairro[] {
      const linhas = banco.prepare('SELECT id, nome, taxa FROM bairros ORDER BY id').all() as Bairro[];
      return linhas.map(paraBairro);
    },
    buscarPorId(id: number): Bairro | undefined {
      const linha = banco.prepare('SELECT id, nome, taxa FROM bairros WHERE id = ?').get(id) as Bairro | undefined;
      return linha && paraBairro(linha);
    },
  };
}

export type RepositorioDosBairros = ReturnType<typeof criarRepositorioDosBairros>;
