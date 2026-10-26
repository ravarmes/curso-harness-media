import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { abrirBanco } from '../../compartilhado/banco.ts';
import { criarApp } from '../../app.ts';

// Sobe o app com banco em memória, numa porta livre, e entrega um cliente.
async function comApp(
  corpoDoTeste: (
    pedir: (metodo: string, caminho: string, corpo?: unknown) => Promise<{ status: number; corpo: unknown }>,
  ) => Promise<void>,
) {
  const servidor = criarApp(abrirBanco(':memory:'));
  await new Promise<void>((ok) => servidor.listen(0, '127.0.0.1', ok));
  const { port } = servidor.address() as AddressInfo;
  try {
    await corpoDoTeste(async (metodo, caminho, corpo) => {
      const resposta = await fetch(`http://127.0.0.1:${port}${caminho}`, {
        method: metodo,
        headers: { 'content-type': 'application/json' },
        body: corpo === undefined ? undefined : JSON.stringify(corpo),
      });
      return { status: resposta.status, corpo: await resposta.json() };
    });
  } finally {
    servidor.close();
  }
}

type Pedir = Parameters<Parameters<typeof comApp>[0]>[0];

// Item 1 X-Burger; ingredientes 1 Pão e 2 Carne (g).
async function prepararCenario(pedir: Pedir) {
  await pedir('POST', '/cardapio', { nome: 'X-Burger', preco: 2500 });
  await pedir('POST', '/estoque', { nome: 'Pão', quantidade: 10 });
  await pedir('POST', '/estoque', { nome: 'Carne (g)', quantidade: 500 });
}

const receitaCompleta = {
  itemId: 1,
  ingredientes: [
    { ingredienteId: 1, nome: 'Pão', quantidade: 1 },
    { ingredienteId: 2, nome: 'Carne (g)', quantidade: 150 },
  ],
};
const corpoCompleto = {
  ingredientes: [
    { ingredienteId: 1, quantidade: 1 },
    { ingredienteId: 2, quantidade: 150 },
  ],
};

test('PUT /cardapio/:id/receita define a receita e devolve 200', () =>
  comApp(async (pedir) => {
    await prepararCenario(pedir);
    assert.deepEqual(await pedir('PUT', '/cardapio/1/receita', corpoCompleto), { status: 200, corpo: receitaCompleta });
  }));

test('PUT /cardapio/:id/receita substitui a receita anterior', () =>
  comApp(async (pedir) => {
    await prepararCenario(pedir);
    await pedir('PUT', '/cardapio/1/receita', corpoCompleto);
    const resposta = await pedir('PUT', '/cardapio/1/receita', {
      ingredientes: [{ ingredienteId: 2, quantidade: 200 }],
    });
    assert.deepEqual(resposta, {
      status: 200,
      corpo: { itemId: 1, ingredientes: [{ ingredienteId: 2, nome: 'Carne (g)', quantidade: 200 }] },
    });
  }));

test('PUT /cardapio/:id/receita recusa corpo inválido com 400 e não muda a receita', () =>
  comApp(async (pedir) => {
    await prepararCenario(pedir);
    await pedir('PUT', '/cardapio/1/receita', corpoCompleto);
    const recusas: [unknown, string][] = [
      [undefined, 'receita deve ter ao menos um ingrediente'],
      [{ ingredientes: 'pão' }, 'receita deve ter ao menos um ingrediente'],
      [{ ingredientes: [] }, 'receita deve ter ao menos um ingrediente'],
      [{ ingredientes: [{ ingredienteId: 1, quantidade: 1.5 }] }, 'quantidade deve ser um inteiro positivo'],
      [{ ingredientes: [{ ingredienteId: 1, quantidade: 0 }] }, 'quantidade deve ser um inteiro positivo'],
      [{ ingredientes: [{ ingredienteId: 'a', quantidade: 1 }] }, 'ingredienteId deve ser um inteiro'],
      [
        {
          ingredientes: [
            { ingredienteId: 1, quantidade: 1 },
            { ingredienteId: 1, quantidade: 2 },
          ],
        },
        'ingrediente repetido na receita',
      ],
      [{ ingredientes: [{ ingredienteId: 999, quantidade: 1 }] }, 'ingrediente 999 não encontrado'],
    ];
    for (const [corpo, erro] of recusas) {
      assert.deepEqual(await pedir('PUT', '/cardapio/1/receita', corpo), { status: 400, corpo: { erro } });
    }
    assert.deepEqual(await pedir('PUT', '/cardapio/1/receita', corpoCompleto), { status: 200, corpo: receitaCompleta });
  }));

test('PUT /cardapio/:id/receita de item inexistente devolve 404', () =>
  comApp(async (pedir) => {
    await prepararCenario(pedir);
    for (const id of ['999', 'abc']) {
      assert.deepEqual(await pedir('PUT', `/cardapio/${id}/receita`, corpoCompleto), {
        status: 404,
        corpo: { erro: 'item não encontrado' },
      });
    }
  }));

test('GET /cardapio/:id/receita devolve a receita definida', () =>
  comApp(async (pedir) => {
    await prepararCenario(pedir);
    await pedir('PUT', '/cardapio/1/receita', corpoCompleto);
    assert.deepEqual(await pedir('GET', '/cardapio/1/receita'), { status: 200, corpo: receitaCompleta });
  }));

test('GET /cardapio/:id/receita de item sem receita devolve lista vazia', () =>
  comApp(async (pedir) => {
    await prepararCenario(pedir);
    assert.deepEqual(await pedir('GET', '/cardapio/1/receita'), {
      status: 200,
      corpo: { itemId: 1, ingredientes: [] },
    });
  }));

test('GET /cardapio/:id/receita de item inexistente devolve 404', () =>
  comApp(async (pedir) => {
    for (const id of ['999', 'abc']) {
      assert.deepEqual(await pedir('GET', `/cardapio/${id}/receita`), {
        status: 404,
        corpo: { erro: 'item não encontrado' },
      });
    }
  }));
