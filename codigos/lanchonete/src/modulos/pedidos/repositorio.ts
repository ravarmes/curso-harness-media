import type { DatabaseSync } from 'node:sqlite';
import type { Pedido } from './dependencias.ts';

// Acesso ao banco do módulo. Só o index.ts do módulo o entrega às fatias.
export function criarRepositorioDePedidos(banco: DatabaseSync) {
  banco.exec(
    'CREATE TABLE IF NOT EXISTS pedidos (id INTEGER PRIMARY KEY, cliente_id TEXT NOT NULL, bairro_id INTEGER NOT NULL, subtotal INTEGER NOT NULL, taxa INTEGER NOT NULL, total INTEGER NOT NULL)',
  );
  // Banco criado antes da F7: acrescenta as colunas do cupom.
  const colunas = (banco.prepare('PRAGMA table_info(pedidos)').all() as { name: string }[]).map((c) => c.name);
  if (!colunas.includes('desconto')) banco.exec('ALTER TABLE pedidos ADD COLUMN desconto INTEGER NOT NULL DEFAULT 0');
  if (!colunas.includes('cupom_id')) banco.exec('ALTER TABLE pedidos ADD COLUMN cupom_id INTEGER');
  // Garantia do banco para "um cupom por cliente".
  banco.exec(
    'CREATE UNIQUE INDEX IF NOT EXISTS pedidos_cliente_cupom ON pedidos (cliente_id, cupom_id) WHERE cupom_id IS NOT NULL',
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
    clienteJaUsouCupom(clienteId: string, cupomId: number): boolean {
      return (
        banco.prepare('SELECT 1 FROM pedidos WHERE cliente_id = ? AND cupom_id = ?').get(clienteId, cupomId) !==
        undefined
      );
    },
    inserir(dados: Omit<Pedido, 'id'>, cupomId: number | null): Pedido {
      const resultado = banco
        .prepare(
          'INSERT INTO pedidos (cliente_id, bairro_id, subtotal, desconto, taxa, total, cupom_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
        .run(dados.clienteId, dados.bairroId, dados.subtotal, dados.desconto, dados.taxa, dados.total, cupomId);
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
