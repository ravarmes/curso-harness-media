import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { abrirBanco } from '../../compartilhado/banco.ts';
import { criarApp } from '../../app.ts';

type Pedir = (metodo: string, caminho: string, corpo?: unknown) => Promise<{ status: number; corpo: unknown }>;

// Sobe o app com banco em memória, numa porta livre, e entrega um cliente.
// O relógio começa às 12:00 de Brasília e pode ser trocado pelo teste.
async function comApp(corpoDoTeste: (pedir: Pedir, definirHora: (iso: string) => void) => Promise<void>) {
  let agora = new Date('2026-10-25T15:00:00Z');
  const servidor = criarApp(abrirBanco(':memory:'), () => agora);
  await new Promise<void>((ok) => servidor.listen(0, '127.0.0.1', ok));
  const { port } = servidor.address() as AddressInfo;
  try {
    await corpoDoTeste(
      async (metodo, caminho, corpo) => {
        const resposta = await fetch(`http://127.0.0.1:${port}${caminho}`, {
          method: metodo,
          headers: { 'content-type': 'application/json' },
          body:
            corpo === undefined || typeof corpo === 'string' ? (corpo as string | undefined) : JSON.stringify(corpo),
        });
        return { status: resposta.status, corpo: await resposta.json() };
      },
      (iso) => {
        agora = new Date(iso);
      },
    );
  } finally {
    servidor.close();
  }
}

// Item 1 X-Burger (2250), item 2 Refri (600), item 3 Água (300, sem receita);
// ingredientes 1 Pão (10), 2 Carne (1000), 3 Refrigerante (5); bairro 1 Centro (500).
async function prepararCenario(pedir: Pedir) {
  await pedir('POST', '/cardapio', { nome: 'X-Burger', preco: 2250 });
  await pedir('POST', '/cardapio', { nome: 'Refri', preco: 600 });
  await pedir('POST', '/cardapio', { nome: 'Água', preco: 300 });
  await pedir('POST', '/estoque', { nome: 'Pão', quantidade: 10 });
  await pedir('POST', '/estoque', { nome: 'Carne', quantidade: 1000 });
  await pedir('POST', '/estoque', { nome: 'Refrigerante', quantidade: 5 });
  await pedir('PUT', '/cardapio/1/receita', {
    ingredientes: [
      { ingredienteId: 1, quantidade: 1 },
      { ingredienteId: 2, quantidade: 150 },
    ],
  });
  await pedir('PUT', '/cardapio/2/receita', { ingredientes: [{ ingredienteId: 3, quantidade: 1 }] });
  await pedir('POST', '/bairros', { nome: 'Centro', taxa: 500 });
}

const pedidoBase = {
  clienteId: 'ana@ex.com',
  bairroId: 1,
  itens: [
    { itemId: 1, quantidade: 2 },
    { itemId: 2, quantidade: 1 },
  ],
};

async function quantidades(pedir: Pedir) {
  const { corpo } = await pedir('GET', '/estoque');
  return (corpo as { quantidade: number }[]).map((i) => i.quantidade);
}

test('POST /pedidos cria o pedido, devolve 201 com o total e baixa o estoque', () =>
  comApp(async (pedir) => {
    await prepararCenario(pedir);
    assert.deepEqual(await pedir('POST', '/pedidos', pedidoBase), {
      status: 201,
      corpo: {
        id: 1,
        clienteId: 'ana@ex.com',
        bairroId: 1,
        itens: [
          { itemId: 1, quantidade: 2, precoUnitario: 2250 },
          { itemId: 2, quantidade: 1, precoUnitario: 600 },
        ],
        subtotal: 5100,
        taxa: 500,
        total: 5600,
      },
    });
    assert.deepEqual(await quantidades(pedir), [8, 700, 4]);
    assert.equal(((await pedir('POST', '/pedidos', pedidoBase)).corpo as { id: number }).id, 2);
  }));

test('POST /pedidos fora do horário devolve 409 e não baixa o estoque', () =>
  comApp(async (pedir, definirHora) => {
    await prepararCenario(pedir);
    const resposta = {
      status: 409,
      corpo: { erro: 'fora do horário de funcionamento (11h às 23h)' },
    };
    definirHora('2026-10-25T13:59:59Z');
    assert.deepEqual(await pedir('POST', '/pedidos', pedidoBase), resposta);
    definirHora('2026-10-26T02:00:00Z');
    assert.deepEqual(await pedir('POST', '/pedidos', pedidoBase), resposta);
    assert.deepEqual(await quantidades(pedir), [10, 1000, 5]);
    definirHora('2026-10-25T14:00:00Z');
    assert.equal((await pedir('POST', '/pedidos', pedidoBase)).status, 201);
    definirHora('2026-10-26T01:59:59Z');
    assert.equal((await pedir('POST', '/pedidos', pedidoBase)).status, 201);
  }));

test('POST /pedidos sem estoque devolve 409, e nada é baixado (tudo ou nada)', () =>
  comApp(async (pedir) => {
    await prepararCenario(pedir);
    const itens = [
      { itemId: 1, quantidade: 1 },
      { itemId: 2, quantidade: 6 },
    ];
    assert.deepEqual(await pedir('POST', '/pedidos', { ...pedidoBase, itens }), {
      status: 409,
      corpo: { erro: 'estoque insuficiente de Refrigerante' },
    });
    assert.deepEqual(await quantidades(pedir), [10, 1000, 5]);
  }));

test('POST /pedidos com corpo inválido devolve 400', () =>
  comApp(async (pedir) => {
    await prepararCenario(pedir);
    const casos: [unknown, string][] = [
      [{ ...pedidoBase, clienteId: '  ' }, 'clienteId deve ser um texto não vazio'],
      [{ ...pedidoBase, bairroId: 'x' }, 'bairroId deve ser um inteiro'],
      [{ ...pedidoBase, itens: [] }, 'pedido deve ter ao menos um item'],
      [{ ...pedidoBase, itens: [{ itemId: 'a', quantidade: 1 }] }, 'itemId deve ser um inteiro'],
      [{ ...pedidoBase, itens: [{ itemId: 1, quantidade: 0 }] }, 'quantidade deve ser um inteiro positivo'],
      [
        {
          ...pedidoBase,
          itens: [
            { itemId: 1, quantidade: 1 },
            { itemId: 1, quantidade: 1 },
          ],
        },
        'item repetido no pedido',
      ],
      [{ ...pedidoBase, bairroId: 999 }, 'bairro 999 não encontrado'],
      [{ ...pedidoBase, itens: [{ itemId: 999, quantidade: 1 }] }, 'item 999 não encontrado'],
      [{ ...pedidoBase, itens: [{ itemId: 3, quantidade: 1 }] }, 'item 3 não tem receita'],
    ];
    for (const [corpo, erro] of casos) {
      assert.deepEqual(await pedir('POST', '/pedidos', corpo), { status: 400, corpo: { erro } }, erro);
    }
    assert.deepEqual(await quantidades(pedir), [10, 1000, 5]);
  }));

test('POST /pedidos com JSON inválido ou sem corpo devolve 400', () =>
  comApp(async (pedir) => {
    assert.deepEqual(await pedir('POST', '/pedidos', '{ quebrado'), { status: 400, corpo: { erro: 'JSON inválido' } });
    assert.deepEqual(await pedir('POST', '/pedidos'), {
      status: 400,
      corpo: { erro: 'clienteId deve ser um texto não vazio' },
    });
  }));
