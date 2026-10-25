import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioProfissionais } from '../repositorio.ts';
import { listarProfissionais } from './listar-profissionais.ts';

const novoRepo = () => criarRepositorioProfissionais(new DatabaseSync(':memory:'));

test('sem profissionais, lista vazia', () => {
  assert.deepEqual(listarProfissionais(novoRepo()), { ok: true, profissionais: [] });
});

test('lista em ordem alfabética de nome', () => {
  const repo = novoRepo();
  repo.inserir({ nome: 'Dra. Carla', especialidade: 'Pele' });
  repo.inserir({ nome: 'Dr. Bruno', especialidade: 'Clínico' });
  const r = listarProfissionais(repo);
  assert.ok(r.ok);
  assert.deepEqual(r.profissionais.map((p) => p.nome), ['Dr. Bruno', 'Dra. Carla']);
});
