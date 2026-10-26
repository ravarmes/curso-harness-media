// Ponta a ponta do relatório de ocupação: códigos e corpos HTTP, com o banco em memória.
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

test('relatório de ocupação: 200 com os números, 400 e 409 nas recusas', async () => {
  assert.deepEqual((await chamar('GET', '/relatorios/ocupacao/2026-11-09/2026-11-10')).corpo.profissionais, []);

  await chamar('POST', '/pacientes', { nome: 'Ana', telefone: '+55 11 99999-8888' });
  await chamar('POST', '/profissionais', { nome: 'Dr. Bruno', especialidade: 'Clínico' });
  await chamar('PUT', '/profissionais/1/expediente', {
    faixas: [
      { dia_semana: 0, inicio: '08:00', fim: '12:00' },
      { dia_semana: 1, inicio: '08:00', fim: '12:00' },
    ],
  });
  const criada = await chamar('POST', '/consultas', {
    paciente_id: 1,
    profissional_id: 1,
    inicio: '2026-11-10T09:00:00-03:00',
    fim: '2026-11-10T10:00:00-03:00',
  });
  assert.equal(criada.status, 201);

  const ok = await chamar('GET', '/relatorios/ocupacao/2026-11-09/2026-11-10');
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.corpo, {
    de: '2026-11-09',
    ate: '2026-11-10',
    profissionais: [
      { profissional_id: 1, nome: 'Dr. Bruno', horas_expediente: 8, horas_ocupadas: 1, percentual_ocupacao: 12.5 },
    ],
  });

  const malformada = await chamar('GET', '/relatorios/ocupacao/10-11-2026/2026-11-10');
  assert.equal(malformada.status, 400);
  assert.deepEqual(malformada.corpo, { erro: 'As datas devem estar no formato AAAA-MM-DD' });

  const invertida = await chamar('GET', '/relatorios/ocupacao/2026-11-10/2026-11-09');
  assert.equal(invertida.status, 409);
  assert.deepEqual(invertida.corpo, { erro: 'A data final não pode ser anterior à inicial' });

  const longa = await chamar('GET', '/relatorios/ocupacao/2026-11-01/2027-02-01');
  assert.equal(longa.status, 409);
  assert.deepEqual(longa.corpo, { erro: 'O período deve ter no máximo 92 dias' });
});
