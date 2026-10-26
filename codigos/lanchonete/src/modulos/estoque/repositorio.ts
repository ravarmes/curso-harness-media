import type { DatabaseSync } from 'node:sqlite';

// Acesso ao banco do módulo. Só o index.ts do módulo o entrega às fatias.
export type Ingrediente = { id: number; nome: string; quantidade: number };

// A chave do nome ignora maiúsculas e minúsculas, inclusive com acento
// (o COLLATE NOCASE do SQLite só trata ASCII).
const chaveDoNome = (nome: string) => nome.toLocaleLowerCase('pt-BR');

// As linhas do SQLite têm protótipo nulo; o ingrediente sai como objeto comum.
const paraIngrediente = ({ id, nome, quantidade }: Ingrediente): Ingrediente => ({ id, nome, quantidade });

export function criarRepositorioDoEstoque(banco: DatabaseSync) {
  banco.exec(
    'CREATE TABLE IF NOT EXISTS ingredientes (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, nome_chave TEXT NOT NULL UNIQUE, quantidade INTEGER NOT NULL)',
  );
  return {
    existeNome(nome: string): boolean {
      return banco.prepare('SELECT 1 FROM ingredientes WHERE nome_chave = ?').get(chaveDoNome(nome)) !== undefined;
    },
    inserir(nome: string, quantidade: number): Ingrediente {
      const resultado = banco
        .prepare('INSERT INTO ingredientes (nome, nome_chave, quantidade) VALUES (?, ?, ?)')
        .run(nome, chaveDoNome(nome), quantidade);
      return { id: Number(resultado.lastInsertRowid), nome, quantidade };
    },
    listar(): Ingrediente[] {
      const linhas = banco.prepare('SELECT id, nome, quantidade FROM ingredientes ORDER BY id').all() as Ingrediente[];
      return linhas.map(paraIngrediente);
    },
    buscarPorId(id: number): Ingrediente | undefined {
      const linha = banco.prepare('SELECT id, nome, quantidade FROM ingredientes WHERE id = ?').get(id) as
        Ingrediente | undefined;
      return linha && paraIngrediente(linha);
    },
    somarQuantidade(id: number, quantidade: number): void {
      banco.prepare('UPDATE ingredientes SET quantidade = quantidade + ? WHERE id = ?').run(quantidade, id);
    },
  };
}

export type RepositorioDoEstoque = ReturnType<typeof criarRepositorioDoEstoque>;
