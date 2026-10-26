import type { Consumo, Dependencias, Pedido } from '../dependencias.ts';
import type { RepositorioDePedidos } from '../repositorio.ts';

export type ResultadoCriarPedido =
  { ok: true; pedido: Pedido } | { ok: false; tipo: 'invalido' | 'recusado'; erro: string };

const invalido = (erro: string): ResultadoCriarPedido => ({ ok: false, tipo: 'invalido', erro });
const recusado = (erro: string): ResultadoCriarPedido => ({ ok: false, tipo: 'recusado', erro });
const ehInteiro = (valor: unknown): valor is number => typeof valor === 'number' && Number.isInteger(valor);

const ABRE_AS = 11;
const FECHA_AS = 23;

// Aberto das 11:00:00 às 22:59:59, no horário de Brasília.
function estaAberto(agora: Date): boolean {
  const hora = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hourCycle: 'h23' }).format(
      agora,
    ),
  );
  return hora >= ABRE_AS && hora < FECHA_AS;
}

// Valida a forma do corpo, depois o horário, depois bairro, itens e receitas
// e, por fim, o estoque. Só com tudo válido o estoque é baixado e o pedido
// gravado, na mesma transação.
export function criarPedido(
  repo: Pick<RepositorioDePedidos, 'transacao' | 'inserir'>,
  deps: Dependencias,
  corpo: unknown,
): ResultadoCriarPedido {
  const dados = (typeof corpo === 'object' && corpo !== null && !Array.isArray(corpo) ? corpo : {}) as {
    clienteId?: unknown;
    bairroId?: unknown;
    itens?: unknown;
  };
  const clienteId = typeof dados.clienteId === 'string' ? dados.clienteId.trim() : '';
  if (clienteId === '') return invalido('clienteId deve ser um texto não vazio');
  const bairroId = dados.bairroId;
  if (!ehInteiro(bairroId)) return invalido('bairroId deve ser um inteiro');
  if (!Array.isArray(dados.itens) || dados.itens.length === 0) return invalido('pedido deve ter ao menos um item');

  const pedidos: { itemId: number; quantidade: number }[] = [];
  for (const entrada of dados.itens as { itemId?: unknown; quantidade?: unknown }[]) {
    const { itemId, quantidade } = entrada ?? {};
    if (!ehInteiro(itemId)) return invalido('itemId deve ser um inteiro');
    if (!ehInteiro(quantidade) || quantidade <= 0) return invalido('quantidade deve ser um inteiro positivo');
    if (pedidos.some((p) => p.itemId === itemId)) return invalido('item repetido no pedido');
    pedidos.push({ itemId, quantidade });
  }

  if (!estaAberto(deps.agora())) return recusado('fora do horário de funcionamento (11h às 23h)');

  const taxa = deps.taxaDoBairro(bairroId);
  if (taxa === undefined) return invalido(`bairro ${bairroId} não encontrado`);

  pedidos.sort((a, b) => a.itemId - b.itemId);
  const itens: Pedido['itens'] = [];
  const consumoTotal = new Map<number, number>();
  for (const { itemId, quantidade } of pedidos) {
    const precoUnitario = deps.precoDoItem(itemId);
    if (precoUnitario === undefined) return invalido(`item ${itemId} não encontrado`);
    const receita = deps.receitaDoItem(itemId);
    if (receita.length === 0) return invalido(`item ${itemId} não tem receita`);
    for (const linha of receita) {
      consumoTotal.set(
        linha.ingredienteId,
        (consumoTotal.get(linha.ingredienteId) ?? 0) + linha.quantidade * quantidade,
      );
    }
    itens.push({ itemId, quantidade, precoUnitario });
  }

  const consumos: Consumo[] = [...consumoTotal]
    .map(([ingredienteId, quantidade]) => ({ ingredienteId, quantidade }))
    .sort((a, b) => a.ingredienteId - b.ingredienteId);
  for (const { ingredienteId, quantidade } of consumos) {
    const ingrediente = deps.ingredienteNoEstoque(ingredienteId);
    if (ingrediente === undefined || ingrediente.quantidade < quantidade) {
      return recusado(`estoque insuficiente de ${ingrediente?.nome ?? `ingrediente ${ingredienteId}`}`);
    }
  }

  const subtotal = itens.reduce((soma, i) => soma + i.precoUnitario * i.quantidade, 0);
  const pedido = repo.transacao(() => {
    deps.baixarEstoque(consumos);
    return repo.inserir({ clienteId, bairroId, itens, subtotal, taxa, total: subtotal + taxa });
  });
  return { ok: true, pedido };
}
