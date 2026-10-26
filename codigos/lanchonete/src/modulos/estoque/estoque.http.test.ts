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

test('POST /estoque cria o ingrediente e devolve 201', () =>
  comApp(async (pedir) => {
    assert.deepEqual(await pedir('POST', '/estoque', { nome: 'Carne (g)', quantidade: 500 }), {
      status: 201,
      corpo: { id: 1, nome: 'Carne (g)', quantidade: 500 },
    });
  }));

test('POST /estoque apara o nome e aceita quantidade zero', () =>
  comApp(async (pedir) => {
    const resposta = await pedir('POST', '/estoque', { nome: '  Pão  ', quantidade: 0 });
    assert.deepEqual(resposta, { status: 201, corpo: { id: 1, nome: 'Pão', quantidade: 0 } });
  }));

test('POST /estoque recusa nome ausente, vazio ou só espaços com 400', () =>
  comApp(async (pedir) => {
    for (const corpo of [
      { quantidade: 10 },
      { nome: '', quantidade: 10 },
      { nome: '   ', quantidade: 10 },
      undefined,
    ]) {
      assert.deepEqual(await pedir('POST', '/estoque', corpo), { status: 400, corpo: { erro: 'nome obrigatório' } });
    }
  }));

test('POST /estoque recusa nome com 81 caracteres com 400', () =>
  comApp(async (pedir) => {
    assert.deepEqual(await pedir('POST', '/estoque', { nome: 'x'.repeat(81), quantidade: 10 }), {
      status: 400,
      corpo: { erro: 'nome com mais de 80 caracteres' },
    });
  }));

test('POST /estoque recusa quantidade ausente, em texto, decimal ou negativa com 400', () =>
  comApp(async (pedir) => {
    for (const quantidade of [undefined, '10', 1.5, -1]) {
      assert.deepEqual(await pedir('POST', '/estoque', { nome: 'Carne (g)', quantidade }), {
        status: 400,
        corpo: { erro: 'quantidade deve ser um inteiro maior ou igual a zero' },
      });
    }
  }));

test('POST /estoque recusa nome repetido, ignorando maiúsculas, com 409', () =>
  comApp(async (pedir) => {
    await pedir('POST', '/estoque', { nome: 'Carne (g)', quantidade: 500 });
    assert.deepEqual(await pedir('POST', '/estoque', { nome: 'carne (G)', quantidade: 100 }), {
      status: 409,
      corpo: { erro: 'já existe um ingrediente com esse nome' },
    });
  }));

test('POST /estoque/1/reposicao soma ao estoque e devolve 200', () =>
  comApp(async (pedir) => {
    await pedir('POST', '/estoque', { nome: 'Carne (g)', quantidade: 500 });
    assert.deepEqual(await pedir('POST', '/estoque/1/reposicao', { quantidade: 100 }), {
      status: 200,
      corpo: { id: 1, nome: 'Carne (g)', quantidade: 600 },
    });
  }));

test('POST /estoque/1/reposicao acumula reposições seguidas', () =>
  comApp(async (pedir) => {
    await pedir('POST', '/estoque', { nome: 'Pão', quantidade: 0 });
    await pedir('POST', '/estoque/1/reposicao', { quantidade: 100 });
    const resposta = await pedir('POST', '/estoque/1/reposicao', { quantidade: 50 });
    assert.deepEqual(resposta.corpo, { id: 1, nome: 'Pão', quantidade: 150 });
  }));

test('POST /estoque/1/reposicao recusa quantidade inválida com 400 e não altera o estoque', () =>
  comApp(async (pedir) => {
    await pedir('POST', '/estoque', { nome: 'Carne (g)', quantidade: 500 });
    for (const corpo of [
      {},
      { quantidade: '10' },
      { quantidade: 1.5 },
      { quantidade: 0 },
      { quantidade: -5 },
      undefined,
    ]) {
      assert.deepEqual(await pedir('POST', '/estoque/1/reposicao', corpo), {
        status: 400,
        corpo: { erro: 'quantidade deve ser um inteiro positivo' },
      });
    }
    const repetida = await pedir('POST', '/estoque/1/reposicao', { quantidade: 1 });
    assert.deepEqual(repetida.corpo, { id: 1, nome: 'Carne (g)', quantidade: 501 });
  }));

test('POST /estoque/:id/reposicao recusa ingrediente inexistente com 404', () =>
  comApp(async (pedir) => {
    for (const id of ['999', 'abc']) {
      assert.deepEqual(await pedir('POST', `/estoque/${id}/reposicao`, { quantidade: 10 }), {
        status: 404,
        corpo: { erro: 'ingrediente não encontrado' },
      });
    }
  }));

test('GET /estoque com banco vazio devolve 200 e lista vazia', () =>
  comApp(async (pedir) => {
    assert.deepEqual(await pedir('GET', '/estoque'), { status: 200, corpo: [] });
  }));

test('GET /estoque devolve os ingredientes em ordem de id', () =>
  comApp(async (pedir) => {
    await pedir('POST', '/estoque', { nome: 'Pão', quantidade: 30 });
    await pedir('POST', '/estoque', { nome: 'Carne (g)', quantidade: 500 });
    assert.deepEqual(await pedir('GET', '/estoque'), {
      status: 200,
      corpo: [
        { id: 1, nome: 'Pão', quantidade: 30 },
        { id: 2, nome: 'Carne (g)', quantidade: 500 },
      ],
    });
  }));

test('GET /estoque/1 devolve o ingrediente com as reposições', () =>
  comApp(async (pedir) => {
    await pedir('POST', '/estoque', { nome: 'Carne (g)', quantidade: 500 });
    await pedir('POST', '/estoque/1/reposicao', { quantidade: 100 });
    assert.deepEqual(await pedir('GET', '/estoque/1'), {
      status: 200,
      corpo: { id: 1, nome: 'Carne (g)', quantidade: 600 },
    });
  }));

test('GET /estoque/:id recusa ingrediente inexistente com 404', () =>
  comApp(async (pedir) => {
    for (const id of ['999', 'abc']) {
      assert.deepEqual(await pedir('GET', `/estoque/${id}`), {
        status: 404,
        corpo: { erro: 'ingrediente não encontrado' },
      });
    }
  }));
