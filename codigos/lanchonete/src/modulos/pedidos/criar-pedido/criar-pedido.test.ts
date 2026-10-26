import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco } from '../../../compartilhado/banco.ts';
import { criarRepositorioDePedidos } from '../repositorio.ts';
import { criarPedido } from './criar-pedido.ts';

const NOMES: Record<number, string> = { 1: 'Pão', 2: 'Carne', 3: 'Refrigerante' };
const PRECOS: Record<number, number> = { 1: 2250, 2: 600, 3: 800, 4: 100 };
const RECEITAS: Record<number, { ingredienteId: number; quantidade: number }[]> = {
  1: [
    { ingredienteId: 1, quantidade: 1 },
    { ingredienteId: 2, quantidade: 150 },
  ],
  2: [{ ingredienteId: 3, quantidade: 1 }],
  3: [],
  4: [{ ingredienteId: 1, quantidade: 1 }],
};
const TAXAS: Record<number, number> = { 1: 500, 2: 0 };
const CUPONS: Record<string, { id: number; codigo: string; percentual: number }> = {
  BEMVINDO10: { id: 1, codigo: 'BEMVINDO10', percentual: 10 },
  TUDO: { id: 2, codigo: 'TUDO', percentual: 100 },
  QUINZE: { id: 3, codigo: 'QUINZE', percentual: 15 },
};
const ESTOQUE_INICIAL = { 1: 10, 2: 1000, 3: 5 };

// Cenário: estoque Pão 10, Carne 1000, Refrigerante 5; relógio às 12:00 de Brasília.
// O item 3 não tem receita; o item 4 também consome Pão.
function cenario(hora = '2026-10-25T15:00:00Z') {
  const estoque: Record<number, number> = { ...ESTOQUE_INICIAL };
  const repo = criarRepositorioDePedidos(abrirBanco(':memory:'));
  const deps = {
    agora: () => new Date(hora),
    precoDoItem: (id: number) => PRECOS[id],
    taxaDoBairro: (id: number) => TAXAS[id],
    cupomPorCodigo: (codigo: string) => CUPONS[codigo],
    receitaDoItem: (id: number) => RECEITAS[id] ?? [],
    ingredienteNoEstoque: (id: number) =>
      NOMES[id] === undefined ? undefined : { nome: NOMES[id], quantidade: estoque[id] },
    baixarEstoque: (consumos: { ingredienteId: number; quantidade: number }[]) => {
      for (const { ingredienteId, quantidade } of consumos) estoque[ingredienteId] -= quantidade;
    },
  };
  return { repo, deps, estoque };
}

const corpo = (extra: object = {}) => ({
  clienteId: 'ana@ex.com',
  bairroId: 1,
  itens: [
    { itemId: 2, quantidade: 1 },
    { itemId: 1, quantidade: 2 },
  ],
  ...extra,
});
const invalido = (erro: string) => ({ ok: false, tipo: 'invalido', erro });
const recusado = (erro: string) => ({ ok: false, tipo: 'recusado', erro });

test('cria o pedido com subtotal, taxa e total, itens em ordem de itemId, e baixa o estoque', () => {
  const { repo, deps, estoque } = cenario();
  assert.deepEqual(criarPedido(repo, deps, corpo()), {
    ok: true,
    pedido: {
      id: 1,
      clienteId: 'ana@ex.com',
      bairroId: 1,
      itens: [
        { itemId: 1, quantidade: 2, precoUnitario: 2250 },
        { itemId: 2, quantidade: 1, precoUnitario: 600 },
      ],
      cupom: null,
      subtotal: 5100,
      desconto: 0,
      taxa: 500,
      total: 5600,
    },
  });
  assert.deepEqual(estoque, { 1: 8, 2: 700, 3: 4 });
});

test('apara o clienteId', () => {
  const { repo, deps } = cenario();
  const r = criarPedido(repo, deps, corpo({ clienteId: '  ana@ex.com  ' }));
  assert.ok(r.ok && r.pedido.clienteId === 'ana@ex.com');
});

test('bairro com taxa 0: total igual ao subtotal', () => {
  const { repo, deps } = cenario();
  const r = criarPedido(repo, deps, corpo({ bairroId: 2 }));
  assert.ok(r.ok && r.pedido.taxa === 0 && r.pedido.total === r.pedido.subtotal);
});

test('ids dos pedidos são sequenciais e a recusa não consome id', () => {
  const { repo, deps } = cenario();
  const primeiro = criarPedido(repo, deps, corpo());
  criarPedido(repo, deps, corpo({ bairroId: 999 }));
  const segundo = criarPedido(repo, deps, corpo());
  assert.deepEqual([primeiro.ok && primeiro.pedido.id, segundo.ok && segundo.pedido.id], [1, 2]);
});

test('item repetido: 400 e estoque intacto', () => {
  const { repo, deps, estoque } = cenario();
  const itens = [
    { itemId: 1, quantidade: 1 },
    { itemId: 1, quantidade: 1 },
  ];
  assert.deepEqual(criarPedido(repo, deps, corpo({ itens })), invalido('item repetido no pedido'));
  assert.deepEqual(estoque, ESTOQUE_INICIAL);
});

test('horário: 10:59:59 recusa, 11:00:00 aceita, 22:59:59 aceita, 23:00:00 recusa', () => {
  const msg = 'fora do horário de funcionamento (11h às 23h)';
  // Brasília é UTC-3.
  const casos: [string, boolean][] = [
    ['2026-10-25T13:59:59Z', false],
    ['2026-10-25T14:00:00Z', true],
    ['2026-10-26T01:59:59Z', true],
    ['2026-10-26T02:00:00Z', false],
  ];
  for (const [hora, aceito] of casos) {
    const { repo, deps, estoque } = cenario(hora);
    const r = criarPedido(repo, deps, corpo());
    if (aceito) {
      assert.equal(r.ok, true, hora);
    } else {
      assert.deepEqual(r, recusado(msg), hora);
      assert.deepEqual(estoque, ESTOQUE_INICIAL);
    }
  }
});

test('estoque insuficiente: 409 citando o ingrediente e estoque intacto', () => {
  const { repo, deps, estoque } = cenario();
  const r = criarPedido(repo, deps, corpo({ itens: [{ itemId: 1, quantidade: 11 }] }));
  assert.deepEqual(r, recusado('estoque insuficiente de Pão'));
  assert.deepEqual(estoque, ESTOQUE_INICIAL);
});

test('tudo ou nada: um item sem estoque impede a baixa dos outros', () => {
  const { repo, deps, estoque } = cenario();
  const itens = [
    { itemId: 1, quantidade: 1 },
    { itemId: 2, quantidade: 6 },
  ];
  assert.deepEqual(criarPedido(repo, deps, corpo({ itens })), recusado('estoque insuficiente de Refrigerante'));
  assert.deepEqual(estoque, ESTOQUE_INICIAL);
});

test('o consumo é somado entre itens antes de comparar com o estoque', () => {
  const { repo, deps, estoque } = cenario();
  // Itens 1 e 4 consomem 1 Pão cada: 6 de cada cabem sozinhos (10), juntos pedem 12.
  const itens = [
    { itemId: 1, quantidade: 6 },
    { itemId: 4, quantidade: 6 },
  ];
  assert.deepEqual(criarPedido(repo, deps, corpo({ itens })), recusado('estoque insuficiente de Pão'));
  assert.deepEqual(estoque, ESTOQUE_INICIAL);
});

test('estoque exatamente igual ao consumo é aceito', () => {
  const { repo, deps, estoque } = cenario();
  const r = criarPedido(repo, deps, corpo({ itens: [{ itemId: 4, quantidade: 10 }] }));
  assert.equal(r.ok, true);
  assert.equal(estoque[1], 0);
});

test('clienteId inválido: 400', () => {
  const { repo, deps } = cenario();
  for (const clienteId of [undefined, 5, '', '   ']) {
    assert.deepEqual(
      criarPedido(repo, deps, corpo({ clienteId })),
      invalido('clienteId deve ser um texto não vazio'),
      String(clienteId),
    );
  }
});

test('bairroId inválido: 400', () => {
  const { repo, deps } = cenario();
  for (const bairroId of [undefined, 'um', 1.5]) {
    assert.deepEqual(criarPedido(repo, deps, corpo({ bairroId })), invalido('bairroId deve ser um inteiro'));
  }
});

test('itens ausente, fora de lista ou vazio: 400', () => {
  const { repo, deps } = cenario();
  for (const itens of [undefined, 'x', {}, []]) {
    assert.deepEqual(criarPedido(repo, deps, corpo({ itens })), invalido('pedido deve ter ao menos um item'));
  }
});

test('itemId inválido em qualquer linha: 400', () => {
  const { repo, deps } = cenario();
  for (const itemId of [undefined, 'um', 1.5]) {
    const itens = [
      { itemId: 1, quantidade: 1 },
      { itemId, quantidade: 1 },
    ];
    assert.deepEqual(criarPedido(repo, deps, corpo({ itens })), invalido('itemId deve ser um inteiro'));
  }
});

test('quantidade inválida em qualquer linha: 400', () => {
  const { repo, deps } = cenario();
  for (const quantidade of [undefined, '2', 1.5, 0, -1]) {
    const itens = [
      { itemId: 1, quantidade: 1 },
      { itemId: 2, quantidade },
    ];
    assert.deepEqual(criarPedido(repo, deps, corpo({ itens })), invalido('quantidade deve ser um inteiro positivo'));
  }
});

test('bairro inexistente: 400 e estoque intacto', () => {
  const { repo, deps, estoque } = cenario();
  assert.deepEqual(criarPedido(repo, deps, corpo({ bairroId: 999 })), invalido('bairro 999 não encontrado'));
  assert.deepEqual(estoque, ESTOQUE_INICIAL);
});

test('item inexistente: 400 e estoque intacto', () => {
  const { repo, deps, estoque } = cenario();
  const itens = [{ itemId: 999, quantidade: 1 }];
  assert.deepEqual(criarPedido(repo, deps, corpo({ itens })), invalido('item 999 não encontrado'));
  assert.deepEqual(estoque, ESTOQUE_INICIAL);
});

test('item sem receita: 400 e estoque intacto', () => {
  const { repo, deps, estoque } = cenario();
  const itens = [{ itemId: 3, quantidade: 1 }];
  assert.deepEqual(criarPedido(repo, deps, corpo({ itens })), invalido('item 3 não tem receita'));
  assert.deepEqual(estoque, ESTOQUE_INICIAL);
});

test('corpo que não é objeto: 400 pela primeira regra do corpo', () => {
  const { repo, deps } = cenario();
  for (const c of [undefined, null, 'x', 5, []]) {
    assert.deepEqual(criarPedido(repo, deps, c), invalido('clienteId deve ser um texto não vazio'));
  }
});

const UM_BURGER = [{ itemId: 1, quantidade: 1 }];

test('cupom: desconto sobre o subtotal, sem descontar a taxa', () => {
  const { repo, deps } = cenario();
  const r = criarPedido(repo, deps, corpo({ cupom: 'BEMVINDO10' }));
  assert.ok(r.ok);
  assert.deepEqual(
    [r.pedido.cupom, r.pedido.subtotal, r.pedido.desconto, r.pedido.taxa, r.pedido.total],
    ['BEMVINDO10', 5100, 510, 500, 5090],
  );
});

test('cupom: apara e põe em maiúsculas', () => {
  const { repo, deps } = cenario();
  const r = criarPedido(repo, deps, corpo({ cupom: '  bemvindo10  ' }));
  assert.ok(r.ok && r.pedido.cupom === 'BEMVINDO10');
});

test('cupom: desconto arredondado para baixo', () => {
  const { repo, deps } = cenario();
  const r = criarPedido(repo, deps, corpo({ cupom: 'QUINZE', itens: UM_BURGER }));
  assert.ok(r.ok && r.pedido.desconto === 337 && r.pedido.total === 2413);
});

test('cupom de 100%: desconto igual ao subtotal e total igual à taxa', () => {
  const { repo, deps } = cenario();
  const r = criarPedido(repo, deps, corpo({ cupom: 'TUDO' }));
  assert.ok(r.ok && r.pedido.desconto === r.pedido.subtotal && r.pedido.total === 500);
});

test('cupom com taxa 0: total = subtotal - desconto, desconto igual ao de taxa 500', () => {
  const { repo, deps } = cenario();
  const r = criarPedido(repo, deps, corpo({ cupom: 'BEMVINDO10', bairroId: 2 }));
  assert.ok(r.ok && r.pedido.desconto === 510 && r.pedido.total === 4590);
});

test('cupom: segundo uso pelo mesmo cliente é recusado, sem baixar estoque', () => {
  const { repo, deps, estoque } = cenario();
  assert.ok(criarPedido(repo, deps, corpo({ cupom: 'BEMVINDO10', itens: UM_BURGER })).ok);
  const antes = { ...estoque };
  assert.deepEqual(
    criarPedido(repo, deps, corpo({ cupom: 'BEMVINDO10', itens: UM_BURGER })),
    recusado('cupom já usado por este cliente'),
  );
  assert.deepEqual(estoque, antes);
  const sem = criarPedido(repo, deps, corpo({ itens: UM_BURGER }));
  assert.ok(sem.ok && sem.pedido.id === 2);
});

test('cupom: vale por cliente e por cupom, e pedido sem cupom segue livre', () => {
  const { repo, deps } = cenario();
  assert.ok(criarPedido(repo, deps, corpo({ cupom: 'BEMVINDO10', itens: UM_BURGER })).ok);
  assert.ok(criarPedido(repo, deps, corpo({ cupom: 'BEMVINDO10', itens: UM_BURGER, clienteId: 'bia@ex.com' })).ok);
  assert.ok(criarPedido(repo, deps, corpo({ cupom: 'TUDO', itens: UM_BURGER })).ok);
  assert.ok(criarPedido(repo, deps, corpo({ itens: UM_BURGER })).ok);
});

test('cupom: clienteId é comparado já aparado', () => {
  const { repo, deps } = cenario();
  assert.ok(criarPedido(repo, deps, corpo({ cupom: 'TUDO', itens: UM_BURGER })).ok);
  assert.deepEqual(
    criarPedido(repo, deps, corpo({ cupom: 'TUDO', itens: UM_BURGER, clienteId: '  ana@ex.com  ' })),
    recusado('cupom já usado por este cliente'),
  );
});

test('cupom: pedido recusado não consome o cupom', () => {
  const { repo, deps } = cenario();
  const semEstoque = [{ itemId: 1, quantidade: 11 }];
  assert.deepEqual(
    criarPedido(repo, deps, corpo({ cupom: 'BEMVINDO10', itens: semEstoque })),
    recusado('estoque insuficiente de Pão'),
  );
  assert.deepEqual(criarPedido(repo, deps, corpo({ cupom: 'BEMVINDO10', itens: [{ itemId: 999, quantidade: 1 }] })), invalido('item 999 não encontrado'));
  assert.ok(criarPedido(repo, deps, corpo({ cupom: 'BEMVINDO10', itens: UM_BURGER })).ok);
});

test('cupom inexistente: 400 e estoque intacto', () => {
  const { repo, deps, estoque } = cenario();
  assert.deepEqual(criarPedido(repo, deps, corpo({ cupom: 'INEXISTENTE' })), invalido('cupom INEXISTENTE não encontrado'));
  assert.deepEqual(estoque, ESTOQUE_INICIAL);
});

test('cupom que não é texto não vazio: 400', () => {
  const { repo, deps } = cenario();
  for (const cupom of [5, {}, [], null, '', '   ']) {
    assert.deepEqual(criarPedido(repo, deps, corpo({ cupom })), invalido('cupom deve ser um texto não vazio'));
  }
});

test('cupom: ordem das validações (horário antes do cupom; cupom usado antes do estoque)', () => {
  const fora = cenario('2026-10-25T13:59:00Z');
  assert.deepEqual(
    criarPedido(fora.repo, fora.deps, corpo({ cupom: 'INEXISTENTE' })),
    recusado('fora do horário de funcionamento (11h às 23h)'),
  );
  const { repo, deps } = cenario();
  assert.ok(criarPedido(repo, deps, corpo({ cupom: 'TUDO', itens: UM_BURGER })).ok);
  assert.deepEqual(
    criarPedido(repo, deps, corpo({ cupom: 'TUDO', itens: [{ itemId: 1, quantidade: 11 }] })),
    recusado('cupom já usado por este cliente'),
  );
});
