import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco } from '../../../compartilhado/banco.ts';
import { criarRepositorioDoEstoque } from '../repositorio.ts';
import { reporIngrediente } from './repor-ingrediente.ts';

const repositorio = () => criarRepositorioDoEstoque(abrirBanco(':memory:'));
const naoEncontrado = { ok: false, tipo: 'inexistente', erro: 'ingrediente não encontrado' };

test('soma a quantidade ao estoque atual', () => {
  const repo = repositorio();
  repo.inserir('Carne (g)', 500);
  assert.deepEqual(reporIngrediente(repo, '1', 100), {
    ok: true,
    ingrediente: { id: 1, nome: 'Carne (g)', quantidade: 600 },
  });
});

test('duas reposições seguidas se acumulam', () => {
  const repo = repositorio();
  repo.inserir('Pão', 0);
  reporIngrediente(repo, '1', 100);
  assert.deepEqual(reporIngrediente(repo, '1', 50), {
    ok: true,
    ingrediente: { id: 1, nome: 'Pão', quantidade: 150 },
  });
});

test('recusa quantidade ausente, em texto, decimal, zero ou negativa e não altera o estoque', () => {
  const repo = repositorio();
  repo.inserir('Carne (g)', 500);
  for (const quantidade of [undefined, '10', 1.5, 0, -5]) {
    assert.deepEqual(reporIngrediente(repo, '1', quantidade), {
      ok: false,
      tipo: 'invalido',
      erro: 'quantidade deve ser um inteiro positivo',
    });
  }
  assert.equal(repo.buscarPorId(1)?.quantidade, 500);
});

test('recusa ingrediente inexistente ou id que não é um inteiro positivo', () => {
  const repo = repositorio();
  for (const id of ['999', 'abc', '1.5', '-1', '0', '']) {
    assert.deepEqual(reporIngrediente(repo, id, 10), naoEncontrado);
  }
});
