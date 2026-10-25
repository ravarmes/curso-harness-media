// Ponta a ponta da agenda: códigos e corpos HTTP, com o banco em memória.
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

test('agendar consulta e ver a agenda do dia', async () => {
  await chamar('POST', '/pacientes', { nome: 'Ana', telefone: '+55 11 99999-8888' });
  await chamar('POST', '/pacientes', { nome: 'Beto', telefone: '+55 11 98888-7777' });
  await chamar('POST', '/profissionais', { nome: 'Dr. Bruno', especialidade: 'Clínico' });
  await chamar('PUT', '/profissionais/1/expediente', { faixas: [{ dia_semana: 1, inicio: '08:00', fim: '12:00' }] });

  const consulta = { paciente_id: 1, profissional_id: 1, inicio: '2026-11-10T09:00:00-03:00', fim: '2026-11-10T10:00:00-03:00' };
  const criada = await chamar('POST', '/consultas', consulta);
  assert.equal(criada.status, 201);
  assert.deepEqual(criada.corpo, { id: 1, ...consulta });

  const agenda = await chamar('GET', '/profissionais/1/agenda/2026-11-10');
  assert.equal(agenda.status, 200);
  assert.deepEqual(agenda.corpo, {
    profissional_id: 1,
    data: '2026-11-10',
    consultas: [{ id: 1, paciente_id: 1, inicio: consulta.inicio, fim: consulta.fim }],
  });
  assert.deepEqual((await chamar('GET', '/profissionais/1/agenda/2026-11-11')).corpo.consultas, []);

  // 409: horário do profissional ocupado, horário do paciente ocupado, fora do expediente
  const sobreposta = { ...consulta, paciente_id: 2, inicio: '2026-11-10T09:30:00-03:00', fim: '2026-11-10T10:30:00-03:00' };
  const ocupado = await chamar('POST', '/consultas', sobreposta);
  assert.equal(ocupado.status, 409);
  assert.equal(typeof ocupado.corpo.erro, 'string');
  const fora = { ...consulta, inicio: '2026-11-10T13:00:00-03:00', fim: '2026-11-10T14:00:00-03:00' };
  assert.equal((await chamar('POST', '/consultas', fora)).status, 409);

  // 400 e 404
  assert.equal((await chamar('POST', '/consultas', { ...consulta, inicio: '2026-11-10T09:00:00' })).status, 400);
  assert.equal((await chamar('POST', '/consultas', { ...consulta, paciente_id: 99 })).status, 404);
  assert.equal((await chamar('POST', '/consultas', { ...consulta, profissional_id: 99 })).status, 404);
  assert.equal((await chamar('GET', '/profissionais/99/agenda/2026-11-10')).status, 404);
  assert.equal((await chamar('GET', '/profissionais/1/agenda/hoje')).status, 400);

  assert.equal((await chamar('GET', '/profissionais/1/agenda/2026-11-10')).corpo.consultas.length, 1);
});
