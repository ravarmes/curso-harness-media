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

test('POST /cardapio cria o item e devolve 201', () =>
  comApp(async (pedir) => {
    assert.deepEqual(await pedir('POST', '/cardapio', { nome: 'X-Burger', preco: 2250 }), {
      status: 201,
      corpo: { id: 1, nome: 'X-Burger', preco: 2250 },
    });
  }));

test('POST /cardapio apara os espaços do nome', () =>
  comApp(async (pedir) => {
    const resposta = await pedir('POST', '/cardapio', { nome: '  X-Burger  ', preco: 2250 });
    assert.deepEqual(resposta.corpo, { id: 1, nome: 'X-Burger', preco: 2250 });
  }));

test('POST /cardapio recusa nome ausente, vazio ou só espaços com 400', () =>
  comApp(async (pedir) => {
    for (const corpo of [{ preco: 2250 }, { nome: '', preco: 2250 }, { nome: '   ', preco: 2250 }, undefined]) {
      assert.deepEqual(await pedir('POST', '/cardapio', corpo), { status: 400, corpo: { erro: 'nome obrigatório' } });
    }
  }));

test('POST /cardapio recusa nome com 81 caracteres com 400', () =>
  comApp(async (pedir) => {
    assert.deepEqual(await pedir('POST', '/cardapio', { nome: 'x'.repeat(81), preco: 2250 }), {
      status: 400,
      corpo: { erro: 'nome com mais de 80 caracteres' },
    });
  }));

test('POST /cardapio recusa preço ausente, em texto, decimal, zero ou negativo com 400', () =>
  comApp(async (pedir) => {
    for (const preco of [undefined, '2250', 10.5, 0, -100]) {
      assert.deepEqual(await pedir('POST', '/cardapio', { nome: 'X-Burger', preco }), {
        status: 400,
        corpo: { erro: 'preço deve ser um inteiro positivo, em centavos' },
      });
    }
  }));

test('POST /cardapio recusa nome repetido, sem diferenciar maiúsculas, com 409', () =>
  comApp(async (pedir) => {
    await pedir('POST', '/cardapio', { nome: 'X-Burger', preco: 2250 });
    assert.deepEqual(await pedir('POST', '/cardapio', { nome: 'x-burger', preco: 1000 }), {
      status: 409,
      corpo: { erro: 'já existe um item com esse nome' },
    });
  }));

test('GET /cardapio com banco vazio devolve 200 e lista vazia', () =>
  comApp(async (pedir) => {
    assert.deepEqual(await pedir('GET', '/cardapio'), { status: 200, corpo: [] });
  }));

test('GET /cardapio devolve os itens em ordem de id', () =>
  comApp(async (pedir) => {
    await pedir('POST', '/cardapio', { nome: 'X-Burger', preco: 2250 });
    await pedir('POST', '/cardapio', { nome: 'Suco de laranja', preco: 900 });
    assert.deepEqual(await pedir('GET', '/cardapio'), {
      status: 200,
      corpo: [
        { id: 1, nome: 'X-Burger', preco: 2250 },
        { id: 2, nome: 'Suco de laranja', preco: 900 },
      ],
    });
  }));

test('GET /cardapio/:id devolve o item existente com 200', () =>
  comApp(async (pedir) => {
    await pedir('POST', '/cardapio', { nome: 'X-Burger', preco: 2250 });
    assert.deepEqual(await pedir('GET', '/cardapio/1'), {
      status: 200,
      corpo: { id: 1, nome: 'X-Burger', preco: 2250 },
    });
  }));

test('GET /cardapio/:id devolve 404 para id inexistente ou inválido', () =>
  comApp(async (pedir) => {
    for (const id of ['999', 'abc']) {
      assert.deepEqual(await pedir('GET', `/cardapio/${id}`), { status: 404, corpo: { erro: 'item não encontrado' } });
    }
  }));
