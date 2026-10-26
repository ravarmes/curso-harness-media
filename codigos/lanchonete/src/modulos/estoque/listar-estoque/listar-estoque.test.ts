import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco } from '../../../compartilhado/banco.ts';
import { criarRepositorioDoEstoque } from '../repositorio.ts';
import { listarEstoque } from './listar-estoque.ts';

const repositorio = () => criarRepositorioDoEstoque(abrirBanco(':memory:'));

test('devolve lista vazia com o banco vazio', () => {
  assert.deepEqual(listarEstoque(repositorio()), []);
});

test('devolve os ingredientes em ordem de id', () => {
  const repo = repositorio();
  repo.inserir('Pão', 30);
  repo.inserir('Carne (g)', 500);
  assert.deepEqual(listarEstoque(repo), [
    { id: 1, nome: 'Pão', quantidade: 30 },
    { id: 2, nome: 'Carne (g)', quantidade: 500 },
  ]);
});
