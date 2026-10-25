import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioProfissionais } from '../repositorio.ts';
import { obterProfissional } from './obter-profissional.ts';

const novoRepo = () => criarRepositorioProfissionais(new DatabaseSync(':memory:'));

test('devolve o profissional cadastrado', () => {
  const repo = novoRepo();
  const bruno = repo.inserir({ nome: 'Dr. Bruno', especialidade: 'Clínico' });
  assert.deepEqual(obterProfissional(repo, String(bruno.id)), { ok: true, profissional: bruno });
});

test('profissional que não existe é inexistente', () => {
  const r = obterProfissional(novoRepo(), '999');
  assert.ok(!r.ok && r.erro.tipo === 'inexistente');
});

test('id que não é número é malformado', () => {
  for (const id of ['abc', '1.5', '-1', '']) {
    const r = obterProfissional(novoRepo(), id);
    assert.ok(!r.ok && r.erro.tipo === 'malformado', id);
  }
});
