import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioPacientes } from '../repositorio.ts';
import { listarPacientes } from './listar-pacientes.ts';

const novoRepo = () => criarRepositorioPacientes(new DatabaseSync(':memory:'));

test('sem pacientes, lista vazia', () => {
  assert.deepEqual(listarPacientes(novoRepo()), { ok: true, pacientes: [] });
});

test('lista em ordem alfabética de nome', () => {
  const repo = novoRepo();
  repo.inserir({ nome: 'Carla', telefone: '+5511999990003', email: null });
  repo.inserir({ nome: 'Ana', telefone: '+5511999990001', email: null });
  repo.inserir({ nome: 'Bia', telefone: '+5511999990002', email: null });
  const r = listarPacientes(repo);
  assert.ok(r.ok);
  assert.deepEqual(
    r.pacientes.map((p) => p.nome),
    ['Ana', 'Bia', 'Carla'],
  );
});
