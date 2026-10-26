// Ponta a ponta da lista de espera: códigos e corpos HTTP, com o banco em memória.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { DatabaseSync } from 'node:sqlite';
import { criarApp } from '../src/app.ts';

const servidor = criarApp(new DatabaseSync(':memory:'));
let base = '';

before(async () => {
  await new Promise<void>((pronto) => servidor.listen(0, pronto));
  base = `http://localhost:${(servidor.address() as AddressInfo).port}`;
});
after(() => servidor.close());

async function chamar(metodo: string, caminho: string, corpo?: unknown) {
  const res = await fetch(base + caminho, {
    method: metodo,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  return { status: res.status, corpo: (await res.json()) as any };
}

test('lista de espera: entrar, consultar em ordem de chegada, sair e as recusas', async () => {
  await chamar('POST', '/pacientes', { nome: 'Ana', telefone: '+55 11 99999-8888' });
  await chamar('POST', '/pacientes', { nome: 'Beto', telefone: '+55 11 98888-7777' });
  await chamar('POST', '/profissionais', { nome: 'Dr. Bruno', especialidade: 'Clínico' });
  const data = '2099-01-10';

  const primeira = await chamar('POST', '/lista-de-espera', { paciente_id: 1, profissional_id: 1, data });
  assert.equal(primeira.status, 201);
  assert.match(primeira.corpo.entrou_em, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$/);
  assert.equal((await chamar('POST', '/lista-de-espera', { paciente_id: 2, profissional_id: 1, data })).status, 201);

  const repetida = await chamar('POST', '/lista-de-espera', { paciente_id: 1, profissional_id: 1, data });
  assert.equal(repetida.status, 409);
  assert.deepEqual(repetida.corpo, { erro: 'O paciente já está na lista de espera deste profissional neste dia' });
  assert.equal((await chamar('POST', '/lista-de-espera', { paciente_id: 9, profissional_id: 1, data })).status, 404);
  assert.equal(
    (await chamar('POST', '/lista-de-espera', { paciente_id: 1, profissional_id: 1, data: 'x' })).status,
    400,
  );
  assert.equal(
    (await chamar('POST', '/lista-de-espera', { paciente_id: 1, profissional_id: 1, data: '2020-01-01' })).status,
    409,
  );

  const fila = await chamar('GET', `/profissionais/1/lista-de-espera/${data}`);
  assert.equal(fila.status, 200);
  assert.deepEqual(
    fila.corpo.fila.map((e: any) => [e.posicao, e.paciente_id]),
    [
      [1, 1],
      [2, 2],
    ],
  );
  assert.equal((await chamar('GET', `/profissionais/9/lista-de-espera/${data}`)).status, 404);
  assert.equal((await chamar('GET', '/profissionais/1/lista-de-espera/2026-02-30')).status, 400);

  const saiu = await chamar('DELETE', `/lista-de-espera/${primeira.corpo.id}`);
  assert.equal(saiu.status, 200);
  assert.equal(saiu.corpo.paciente_id, 1);
  assert.equal((await chamar('DELETE', `/lista-de-espera/${primeira.corpo.id}`)).status, 404);
  assert.equal((await chamar('DELETE', '/lista-de-espera/abc')).status, 400);

  const depois = await chamar('GET', `/profissionais/1/lista-de-espera/${data}`);
  assert.deepEqual(
    depois.corpo.fila.map((e: any) => e.paciente_id),
    [2],
  );
});
