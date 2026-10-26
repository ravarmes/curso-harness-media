import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco } from '../../../compartilhado/banco.ts';
import { criarRepositorioDoEstoque } from '../repositorio.ts';
import { consultarIngrediente } from './consultar-ingrediente.ts';

const repositorio = () => criarRepositorioDoEstoque(abrirBanco(':memory:'));
const naoEncontrado = { ok: false, erro: 'ingrediente não encontrado' };

test('devolve o ingrediente existente', () => {
  const repo = repositorio();
  repo.inserir('Carne (g)', 500);
  assert.deepEqual(consultarIngrediente(repo, '1'), {
    ok: true,
    ingrediente: { id: 1, nome: 'Carne (g)', quantidade: 500 },
  });
});

test('reflete a quantidade depois de uma reposição', () => {
  const repo = repositorio();
  repo.inserir('Carne (g)', 500);
  repo.somarQuantidade(1, 100);
  assert.deepEqual(consultarIngrediente(repo, '1'), {
    ok: true,
    ingrediente: { id: 1, nome: 'Carne (g)', quantidade: 600 },
  });
});

test('recusa id inexistente', () => {
  assert.deepEqual(consultarIngrediente(repositorio(), '999'), naoEncontrado);
});

test('recusa id que não é um inteiro positivo', () => {
  for (const id of ['abc', '1.5', '-1', '0', '', '1abc']) {
    assert.deepEqual(consultarIngrediente(repositorio(), id), naoEncontrado);
  }
});
