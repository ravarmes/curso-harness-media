import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioProfissionais } from '../repositorio.ts';
import { obterExpediente } from './obter-expediente.ts';

const novoRepo = () => criarRepositorioProfissionais(new DatabaseSync(':memory:'));

test('profissional sem expediente tem lista vazia', () => {
  const repo = novoRepo();
  const { id } = repo.inserir({ nome: 'Dr. Bruno', especialidade: 'Clínico' });
  assert.deepEqual(obterExpediente(repo, String(id)), { ok: true, faixas: [] });
});

test('devolve as faixas em HH:MM, ordenadas por dia e início', () => {
  const repo = novoRepo();
  const { id } = repo.inserir({ nome: 'Dr. Bruno', especialidade: 'Clínico' });
  repo.substituirExpediente(id, [
    { dia_semana: 3, inicio_min: 14 * 60, fim_min: 24 * 60 },
    { dia_semana: 1, inicio_min: 14 * 60, fim_min: 18 * 60 },
    { dia_semana: 1, inicio_min: 8 * 60, fim_min: 12 * 60 + 30 },
  ]);
  assert.deepEqual(obterExpediente(repo, String(id)), {
    ok: true,
    faixas: [
      { dia_semana: 1, inicio: '08:00', fim: '12:30' },
      { dia_semana: 1, inicio: '14:00', fim: '18:00' },
      { dia_semana: 3, inicio: '14:00', fim: '24:00' },
    ],
  });
});

test('profissional que não existe é inexistente', () => {
  const r = obterExpediente(novoRepo(), '999');
  assert.ok(!r.ok && r.erro.tipo === 'inexistente');
});

test('id que não é número é malformado', () => {
  const r = obterExpediente(novoRepo(), 'abc');
  assert.ok(!r.ok && r.erro.tipo === 'malformado');
});
