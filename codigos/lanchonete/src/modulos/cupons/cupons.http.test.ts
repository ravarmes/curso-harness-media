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

const erroPercentual = { erro: 'percentual deve ser um inteiro de 1 a 100' };

test('POST /cupons cria o cupom e devolve 201', () =>
  comApp(async (pedir) => {
    assert.deepEqual(await pedir('POST', '/cupons', { codigo: 'BEMVINDO10', percentual: 10 }), {
      status: 201,
      corpo: { id: 1, codigo: 'BEMVINDO10', percentual: 10 },
    });
  }));

test('POST /cupons apara o código, converte para maiúsculas e aceita 100%', () =>
  comApp(async (pedir) => {
    const resposta = await pedir('POST', '/cupons', { codigo: '  bemvindo10  ', percentual: 100 });
    assert.deepEqual(resposta, { status: 201, corpo: { id: 1, codigo: 'BEMVINDO10', percentual: 100 } });
  }));

test('POST /cupons recusa código ausente, vazio ou só espaços com 400', () =>
  comApp(async (pedir) => {
    for (const corpo of [
      { percentual: 10 },
      { codigo: '', percentual: 10 },
      { codigo: '   ', percentual: 10 },
      undefined,
    ]) {
      assert.deepEqual(await pedir('POST', '/cupons', corpo), { status: 400, corpo: { erro: 'código obrigatório' } });
    }
  }));

test('POST /cupons recusa código com 31 caracteres com 400', () =>
  comApp(async (pedir) => {
    assert.deepEqual(await pedir('POST', '/cupons', { codigo: 'X'.repeat(31), percentual: 10 }), {
      status: 400,
      corpo: { erro: 'código com mais de 30 caracteres' },
    });
  }));

test('POST /cupons recusa código com caracteres inválidos com 400', () =>
  comApp(async (pedir) => {
    assert.deepEqual(await pedir('POST', '/cupons', { codigo: 'DEZ POR CENTO', percentual: 10 }), {
      status: 400,
      corpo: { erro: 'código aceita só letras, números e hífen' },
    });
  }));

test('POST /cupons recusa percentual ausente, em texto, decimal, zero, negativo ou 101 com 400', () =>
  comApp(async (pedir) => {
    for (const percentual of [undefined, '10', 7.5, 0, -1, 101]) {
      assert.deepEqual(await pedir('POST', '/cupons', { codigo: 'BEMVINDO10', percentual }), {
        status: 400,
        corpo: erroPercentual,
      });
    }
  }));

test('POST /cupons recusa código repetido com 409', () =>
  comApp(async (pedir) => {
    await pedir('POST', '/cupons', { codigo: 'BEMVINDO10', percentual: 10 });
    assert.deepEqual(await pedir('POST', '/cupons', { codigo: 'bemvindo10', percentual: 50 }), {
      status: 409,
      corpo: { erro: 'já existe um cupom com esse código' },
    });
  }));

test('GET /cupons/:codigo devolve o cupom', () =>
  comApp(async (pedir) => {
    await pedir('POST', '/cupons', { codigo: 'BEMVINDO10', percentual: 10 });
    assert.deepEqual(await pedir('GET', '/cupons/BEMVINDO10'), {
      status: 200,
      corpo: { id: 1, codigo: 'BEMVINDO10', percentual: 10 },
    });
  }));

test('GET /cupons/:codigo ignora maiúsculas e minúsculas', () =>
  comApp(async (pedir) => {
    await pedir('POST', '/cupons', { codigo: 'BEMVINDO10', percentual: 10 });
    assert.deepEqual(await pedir('GET', '/cupons/bemvindo10'), {
      status: 200,
      corpo: { id: 1, codigo: 'BEMVINDO10', percentual: 10 },
    });
  }));

test('GET /cupons/:codigo recusa código inexistente com 404', () =>
  comApp(async (pedir) => {
    assert.deepEqual(await pedir('GET', '/cupons/INEXISTENTE'), {
      status: 404,
      corpo: { erro: 'cupom não encontrado' },
    });
  }));
