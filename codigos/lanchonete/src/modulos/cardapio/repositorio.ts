import type { DatabaseSync } from 'node:sqlite';

// Acesso ao banco do módulo. Só o index.ts do módulo o entrega às fatias.
export type ItemDoCardapio = { id: number; nome: string; preco: number };

// A chave do nome ignora maiúsculas e minúsculas, inclusive com acento
// (o COLLATE NOCASE do SQLite só trata ASCII).
const chaveDoNome = (nome: string) => nome.toLocaleLowerCase('pt-BR');

export function criarRepositorioDoCardapio(banco: DatabaseSync) {
  banco.exec(
    'CREATE TABLE IF NOT EXISTS itens_do_cardapio (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, nome_chave TEXT NOT NULL UNIQUE, preco INTEGER NOT NULL)',
  );
  return {
    existeNome(nome: string): boolean {
      return banco.prepare('SELECT 1 FROM itens_do_cardapio WHERE nome_chave = ?').get(chaveDoNome(nome)) !== undefined;
    },
    inserir(nome: string, preco: number): ItemDoCardapio {
      const resultado = banco
        .prepare('INSERT INTO itens_do_cardapio (nome, nome_chave, preco) VALUES (?, ?, ?)')
        .run(nome, chaveDoNome(nome), preco);
      return { id: Number(resultado.lastInsertRowid), nome, preco };
    },
    listar(): ItemDoCardapio[] {
      return banco.prepare('SELECT id, nome, preco FROM itens_do_cardapio ORDER BY id').all() as ItemDoCardapio[];
    },
    buscarPorId(id: number): ItemDoCardapio | undefined {
      return banco.prepare('SELECT id, nome, preco FROM itens_do_cardapio WHERE id = ?').get(id) as
        ItemDoCardapio | undefined;
    },
  };
}

export type RepositorioDoCardapio = ReturnType<typeof criarRepositorioDoCardapio>;
