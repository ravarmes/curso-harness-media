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

const erroTaxa = { erro: 'taxa deve ser um inteiro maior ou igual a zero, em centavos' };

test('POST /bairros cria o bairro e devolve 201', () =>
  comApp(async (pedir) => {
    assert.deepEqual(await pedir('POST', '/bairros', { nome: 'Centro', taxa: 500 }), {
      status: 201,
      corpo: { id: 1, nome: 'Centro', taxa: 500 },
    });
  }));

test('POST /bairros apara o nome e aceita taxa zero', () =>
  comApp(async (pedir) => {
    const resposta = await pedir('POST', '/bairros', { nome: '  Vila Nova  ', taxa: 0 });
    assert.deepEqual(resposta, { status: 201, corpo: { id: 1, nome: 'Vila Nova', taxa: 0 } });
  }));

test('POST /bairros recusa nome ausente, vazio ou só espaços com 400', () =>
  comApp(async (pedir) => {
    for (const corpo of [{ taxa: 500 }, { nome: '', taxa: 500 }, { nome: '   ', taxa: 500 }, undefined]) {
      assert.deepEqual(await pedir('POST', '/bairros', corpo), { status: 400, corpo: { erro: 'nome obrigatório' } });
    }
  }));

test('POST /bairros recusa nome com 81 caracteres com 400', () =>
  comApp(async (pedir) => {
    assert.deepEqual(await pedir('POST', '/bairros', { nome: 'x'.repeat(81), taxa: 500 }), {
      status: 400,
      corpo: { erro: 'nome com mais de 80 caracteres' },
    });
  }));

test('POST /bairros recusa taxa ausente, em texto, decimal ou negativa com 400', () =>
  comApp(async (pedir) => {
    for (const corpo of [
      { nome: 'Centro' },
      { nome: 'Centro', taxa: '500' },
      { nome: 'Centro', taxa: 5.5 },
      { nome: 'Centro', taxa: -1 },
    ]) {
      assert.deepEqual(await pedir('POST', '/bairros', corpo), { status: 400, corpo: erroTaxa });
    }
  }));

test('POST /bairros recusa nome repetido com 409 e mantém a taxa original', () =>
  comApp(async (pedir) => {
    await pedir('POST', '/bairros', { nome: 'Centro', taxa: 500 });
    assert.deepEqual(await pedir('POST', '/bairros', { nome: 'centro', taxa: 100 }), {
      status: 409,
      corpo: { erro: 'já existe um bairro com esse nome' },
    });
    assert.deepEqual(await pedir('GET', '/bairros/1'), { status: 200, corpo: { id: 1, nome: 'Centro', taxa: 500 } });
  }));

test('GET /bairros com banco vazio devolve 200 e lista vazia', () =>
  comApp(async (pedir) => {
    assert.deepEqual(await pedir('GET', '/bairros'), { status: 200, corpo: [] });
  }));

test('GET /bairros devolve os bairros em ordem de id', () =>
  comApp(async (pedir) => {
    await pedir('POST', '/bairros', { nome: 'Centro', taxa: 500 });
    await pedir('POST', '/bairros', { nome: 'Vila Nova', taxa: 0 });
    assert.deepEqual(await pedir('GET', '/bairros'), {
      status: 200,
      corpo: [
        { id: 1, nome: 'Centro', taxa: 500 },
        { id: 2, nome: 'Vila Nova', taxa: 0 },
      ],
    });
  }));

test('GET /bairros/:id devolve o bairro com a taxa', () =>
  comApp(async (pedir) => {
    await pedir('POST', '/bairros', { nome: 'Centro', taxa: 500 });
    assert.deepEqual(await pedir('GET', '/bairros/1'), { status: 200, corpo: { id: 1, nome: 'Centro', taxa: 500 } });
  }));

test('GET /bairros/:id recusa id inexistente ou não numérico com 404', () =>
  comApp(async (pedir) => {
    for (const id of ['999', 'abc']) {
      assert.deepEqual(await pedir('GET', `/bairros/${id}`), { status: 404, corpo: { erro: 'bairro não encontrado' } });
    }
  }));
