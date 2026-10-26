import type { DatabaseSync } from 'node:sqlite';

// Acesso ao banco do módulo. Só o index.ts do módulo o entrega às fatias.
export type LinhaDaReceita = { ingredienteId: number; quantidade: number };

export function criarRepositorioDeReceitas(banco: DatabaseSync) {
  banco.exec(
    'CREATE TABLE IF NOT EXISTS receitas (item_id INTEGER NOT NULL, ingrediente_id INTEGER NOT NULL, quantidade INTEGER NOT NULL, PRIMARY KEY (item_id, ingrediente_id))',
  );
  return {
    // Troca a receita inteira de uma vez: ou grava tudo, ou nada muda.
    substituir(itemId: number, linhas: LinhaDaReceita[]): void {
      banco.exec('BEGIN');
      try {
        banco.prepare('DELETE FROM receitas WHERE item_id = ?').run(itemId);
        const inserir = banco.prepare('INSERT INTO receitas (item_id, ingrediente_id, quantidade) VALUES (?, ?, ?)');
        for (const { ingredienteId, quantidade } of linhas) inserir.run(itemId, ingredienteId, quantidade);
        banco.exec('COMMIT');
      } catch (erro) {
        banco.exec('ROLLBACK');
        throw erro;
      }
    },
    // As linhas do SQLite têm protótipo nulo; a linha sai como objeto comum.
    listar(itemId: number): LinhaDaReceita[] {
      const linhas = banco
        .prepare('SELECT ingrediente_id, quantidade FROM receitas WHERE item_id = ? ORDER BY ingrediente_id')
        .all(itemId) as { ingrediente_id: number; quantidade: number }[];
      return linhas.map((l) => ({ ingredienteId: l.ingrediente_id, quantidade: l.quantidade }));
    },
  };
}

export type RepositorioDeReceitas = ReturnType<typeof criarRepositorioDeReceitas>;
