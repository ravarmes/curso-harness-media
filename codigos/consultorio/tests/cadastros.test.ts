// Ponta a ponta: sobe a API de verdade (banco em memória) e confere códigos e corpos HTTP.
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

test('pacientes: cadastro, consulta e erros', async () => {
  const criado = await chamar('POST', '/pacientes', { nome: 'Ana', telefone: '+55 11 99999-8888' });
  assert.equal(criado.status, 201);
  assert.deepEqual(criado.corpo, { id: 1, nome: 'Ana', telefone: '+5511999998888', email: null });

  assert.deepEqual((await chamar('GET', '/pacientes/1')).corpo, criado.corpo);
  assert.equal((await chamar('GET', '/pacientes')).corpo.length, 1);

  const ruim = await chamar('POST', '/pacientes', { nome: 'X', telefone: '123' });
  assert.equal(ruim.status, 400);
  assert.equal(typeof ruim.corpo.erro, 'string');
  assert.equal((await chamar('GET', '/pacientes/999')).status, 404);
});

test('profissionais e expediente: cadastro, definição, leitura e erros', async () => {
  const criado = await chamar('POST', '/profissionais', { nome: 'Dr. Bruno', especialidade: 'Clínico' });
  assert.equal(criado.status, 201);
  assert.deepEqual(criado.corpo, { id: 1, nome: 'Dr. Bruno', especialidade: 'Clínico' });
  assert.equal((await chamar('GET', '/profissionais/1')).corpo.nome, 'Dr. Bruno');
  assert.equal((await chamar('GET', '/profissionais')).corpo.length, 1);
  assert.equal((await chamar('POST', '/profissionais', { nome: 'Sem especialidade' })).status, 400);
  assert.equal((await chamar('GET', '/profissionais/999')).status, 404);

  const faixas = [
    { dia_semana: 1, inicio: '08:00', fim: '12:00' },
    { dia_semana: 1, inicio: '14:00', fim: '18:00' },
  ];
  const definido = await chamar('PUT', '/profissionais/1/expediente', { faixas });
  assert.equal(definido.status, 200);
  assert.deepEqual(definido.corpo, { faixas });
  assert.deepEqual((await chamar('GET', '/profissionais/1/expediente')).corpo, { faixas });

  const sobreposta = [{ dia_semana: 1, inicio: '08:00', fim: '12:00' }, { dia_semana: 1, inicio: '11:00', fim: '15:00' }];
  assert.equal((await chamar('PUT', '/profissionais/1/expediente', { faixas: sobreposta })).status, 400);
  assert.equal((await chamar('PUT', '/profissionais/999/expediente', { faixas: [] })).status, 404);
  assert.equal((await chamar('GET', '/profissionais/999/expediente')).status, 404);
  assert.deepEqual((await chamar('GET', '/profissionais/1/expediente')).corpo, { faixas });
});

test('JSON inválido é 400 com {"erro"}', async () => {
  const res = await fetch(`${base}/pacientes`, { method: 'POST', body: '{quebrado' });
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { erro: 'JSON inválido' });
});
