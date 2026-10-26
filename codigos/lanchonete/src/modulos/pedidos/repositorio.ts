import type { DatabaseSync } from 'node:sqlite';
import type { Pedido } from './dependencias.ts';

// Acesso ao banco do módulo. Só o index.ts do módulo o entrega às fatias.
export function criarRepositorioDePedidos(banco: DatabaseSync) {
  banco.exec(
    'CREATE TABLE IF NOT EXISTS pedidos (id INTEGER PRIMARY KEY, cliente_id TEXT NOT NULL, bairro_id INTEGER NOT NULL, subtotal INTEGER NOT NULL, taxa INTEGER NOT NULL, total INTEGER NOT NULL)',
  );
  banco.exec(
    'CREATE TABLE IF NOT EXISTS itens_do_pedido (pedido_id INTEGER NOT NULL, item_id INTEGER NOT NULL, quantidade INTEGER NOT NULL, preco_unitario INTEGER NOT NULL, PRIMARY KEY (pedido_id, item_id))',
  );
  return {
    // Roda `trabalho` numa transação do banco: se ele lançar, nada fica gravado.
    transacao<T>(trabalho: () => T): T {
      banco.exec('BEGIN');
      try {
        const resultado = trabalho();
        banco.exec('COMMIT');
        return resultado;
      } catch (erro) {
        banco.exec('ROLLBACK');
        throw erro;
      }
    },
    inserir(dados: Omit<Pedido, 'id'>): Pedido {
      const resultado = banco
        .prepare('INSERT INTO pedidos (cliente_id, bairro_id, subtotal, taxa, total) VALUES (?, ?, ?, ?, ?)')
        .run(dados.clienteId, dados.bairroId, dados.subtotal, dados.taxa, dados.total);
      const id = Number(resultado.lastInsertRowid);
      const inserirItem = banco.prepare(
        'INSERT INTO itens_do_pedido (pedido_id, item_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
      );
      for (const { itemId, quantidade, precoUnitario } of dados.itens) {
        inserirItem.run(id, itemId, quantidade, precoUnitario);
      }
      return { id, ...dados };
    },
  };
}

export type RepositorioDePedidos = ReturnType<typeof criarRepositorioDePedidos>;
