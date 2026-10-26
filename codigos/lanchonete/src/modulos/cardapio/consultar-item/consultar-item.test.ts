import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco } from '../../../compartilhado/banco.ts';
import { criarRepositorioDoCardapio } from '../repositorio.ts';
import { consultarItem } from './consultar-item.ts';

const repositorio = () => criarRepositorioDoCardapio(abrirBanco(':memory:'));
const naoEncontrado = { ok: false, erro: 'item não encontrado' };

test('devolve o item existente', () => {
  const repo = repositorio();
  repo.inserir('X-Burger', 2250);
  assert.deepEqual(consultarItem(repo, '1'), { ok: true, item: { id: 1, nome: 'X-Burger', preco: 2250 } });
});

test('recusa id inexistente', () => {
  assert.deepEqual(consultarItem(repositorio(), '999'), naoEncontrado);
});

test('recusa id que não é um inteiro positivo', () => {
  for (const id of ['abc', '1.5', '-1', '0', '', '1abc']) {
    assert.deepEqual(consultarItem(repositorio(), id), naoEncontrado);
  }
});
