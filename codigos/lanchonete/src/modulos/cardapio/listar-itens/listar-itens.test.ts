import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco } from '../../../compartilhado/banco.ts';
import { criarRepositorioDoCardapio } from '../repositorio.ts';
import { listarItens } from './listar-itens.ts';

const repositorio = () => criarRepositorioDoCardapio(abrirBanco(':memory:'));

test('devolve lista vazia quando não há itens', () => {
  assert.deepEqual(listarItens(repositorio()), []);
});

test('devolve os itens em ordem de id', () => {
  const repo = repositorio();
  repo.inserir('X-Burger', 2250);
  repo.inserir('Suco de laranja', 900);
  assert.deepEqual(listarItens(repo), [
    { id: 1, nome: 'X-Burger', preco: 2250 },
    { id: 2, nome: 'Suco de laranja', preco: 900 },
  ]);
});
