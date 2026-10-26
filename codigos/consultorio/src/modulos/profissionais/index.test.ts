import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioProfissionais } from './repositorio.ts';
import { profissionais } from './index.ts';

test('listar devolve id e nome de todos os profissionais em ordem de id', () => {
  const banco = new DatabaseSync(':memory:');
  const repo = criarRepositorioProfissionais(banco);
  repo.inserir({ nome: 'Dra. Carla', especialidade: 'Pele' });
  repo.inserir({ nome: 'Dr. Bruno', especialidade: 'Clínico' });
  assert.deepEqual(profissionais(banco).listar(), [
    { id: 1, nome: 'Dra. Carla' },
    { id: 2, nome: 'Dr. Bruno' },
  ]);
});

test('listar sem profissionais devolve lista vazia', () => {
  assert.deepEqual(profissionais(new DatabaseSync(':memory:')).listar(), []);
});
