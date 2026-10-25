import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioProfissionais } from '../repositorio.ts';
import { cadastrarProfissional } from './cadastrar-profissional.ts';

const novoRepo = () => criarRepositorioProfissionais(new DatabaseSync(':memory:'));

test('cadastra o profissional', () => {
  const r = cadastrarProfissional(novoRepo(), { nome: ' Dr. Bruno ', especialidade: 'Clínico' });
  assert.deepEqual(r, { ok: true, profissional: { id: 1, nome: 'Dr. Bruno', especialidade: 'Clínico' } });
});

test('recusa dado malformado ou faltando, sem gravar', () => {
  const repo = novoRepo();
  const ruins: unknown[] = [
    undefined,
    null,
    {},
    { nome: 'Dr. Bruno' },
    { especialidade: 'Clínico' },
    { nome: '', especialidade: 'Clínico' },
    { nome: 'Dr. Bruno', especialidade: '  ' },
    { nome: 7, especialidade: 'Clínico' },
  ];
  for (const dados of ruins) {
    const r = cadastrarProfissional(repo, dados);
    assert.ok(!r.ok && r.erro.tipo === 'malformado', JSON.stringify(dados));
  }
  assert.deepEqual(repo.listar(), []);
});
