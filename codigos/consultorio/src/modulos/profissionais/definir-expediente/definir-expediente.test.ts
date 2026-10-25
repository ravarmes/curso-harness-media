import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioProfissionais } from '../repositorio.ts';
import { definirExpediente } from './definir-expediente.ts';

function novoCenario() {
  const repo = criarRepositorioProfissionais(new DatabaseSync(':memory:'));
  const id = String(repo.inserir({ nome: 'Dr. Bruno', especialidade: 'Clínico' }).id);
  return { repo, id };
}
const faixa = (dia_semana: unknown, inicio: unknown, fim: unknown) => ({ dia_semana, inicio, fim });

test('define o expediente e devolve as faixas', () => {
  const { repo, id } = novoCenario();
  const faixas = [faixa(1, '08:00', '12:00'), faixa(1, '14:00', '18:00'), faixa(5, '00:00', '24:00')];
  assert.deepEqual(definirExpediente(repo, id, { faixas }), { ok: true, faixas });
});

test('faixas encostadas no mesmo dia são aceitas', () => {
  const { repo, id } = novoCenario();
  const r = definirExpediente(repo, id, { faixas: [faixa(2, '08:00', '12:00'), faixa(2, '12:00', '18:00')] });
  assert.ok(r.ok);
});

test('substitui o expediente anterior; lista vazia limpa tudo', () => {
  const { repo, id } = novoCenario();
  definirExpediente(repo, id, { faixas: [faixa(1, '08:00', '12:00')] });
  assert.deepEqual(definirExpediente(repo, id, { faixas: [faixa(2, '09:00', '10:00')] }), {
    ok: true,
    faixas: [faixa(2, '09:00', '10:00')],
  });
  assert.deepEqual(definirExpediente(repo, id, { faixas: [] }), { ok: true, faixas: [] });
});

test('o expediente de um profissional não mexe no de outro', () => {
  const { repo, id } = novoCenario();
  const outro = String(repo.inserir({ nome: 'Dra. Carla', especialidade: 'Pele' }).id);
  definirExpediente(repo, id, { faixas: [faixa(1, '08:00', '12:00')] });
  definirExpediente(repo, outro, { faixas: [faixa(3, '13:00', '17:00')] });
  assert.deepEqual(definirExpediente(repo, id, { faixas: [faixa(1, '08:00', '12:00')] }), {
    ok: true,
    faixas: [faixa(1, '08:00', '12:00')],
  });
  assert.equal(repo.expediente(Number(outro)).length, 1);
});

test('recusa faixas malformadas ou incoerentes, sem alterar o que existe', () => {
  const { repo, id } = novoCenario();
  const original = [faixa(1, '08:00', '12:00')];
  definirExpediente(repo, id, { faixas: original });

  const ruins: unknown[] = [
    undefined,
    {},
    { faixas: 'segunda' },
    { faixas: [null] },
    { faixas: [faixa(7, '08:00', '12:00')] },
    { faixas: [faixa(-1, '08:00', '12:00')] },
    { faixas: [faixa(1.5, '08:00', '12:00')] },
    { faixas: [faixa('1', '08:00', '12:00')] },
    { faixas: [faixa(1, '8h', '12:00')] },
    { faixas: [faixa(1, '08:00', '12:60')] },
    { faixas: [faixa(1, '08:00', '24:30')] },
    { faixas: [faixa(1, '08:00', undefined)] },
    { faixas: [faixa(1, '12:00', '08:00')] },
    { faixas: [faixa(1, '08:00', '08:00')] },
    { faixas: [faixa(1, '08:00', '12:00'), faixa(1, '11:00', '15:00')] },
  ];
  for (const dados of ruins) {
    const r = definirExpediente(repo, id, dados);
    assert.ok(!r.ok && r.erro.tipo === 'malformado', JSON.stringify(dados));
  }
  assert.deepEqual(definirExpediente(repo, id, { faixas: original }), { ok: true, faixas: original });
});

test('profissional que não existe é inexistente', () => {
  const { repo } = novoCenario();
  const r = definirExpediente(repo, '999', { faixas: [] });
  assert.ok(!r.ok && r.erro.tipo === 'inexistente');
});

test('id que não é número é malformado', () => {
  const { repo } = novoCenario();
  const r = definirExpediente(repo, 'abc', { faixas: [] });
  assert.ok(!r.ok && r.erro.tipo === 'malformado');
});
