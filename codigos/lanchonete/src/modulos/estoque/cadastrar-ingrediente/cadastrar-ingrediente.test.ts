import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco } from '../../../compartilhado/banco.ts';
import { criarRepositorioDoEstoque } from '../repositorio.ts';
import { cadastrarIngrediente } from './cadastrar-ingrediente.ts';

const repositorio = () => criarRepositorioDoEstoque(abrirBanco(':memory:'));
const invalido = (erro: string) => ({ ok: false, tipo: 'invalido', erro });
const erroQuantidade = 'quantidade deve ser um inteiro maior ou igual a zero';

test('cadastra o ingrediente com a quantidade inicial', () => {
  assert.deepEqual(cadastrarIngrediente(repositorio(), 'Carne (g)', 500), {
    ok: true,
    ingrediente: { id: 1, nome: 'Carne (g)', quantidade: 500 },
  });
});

test('apara os espaços do nome e aceita quantidade zero', () => {
  assert.deepEqual(cadastrarIngrediente(repositorio(), '  Pão  ', 0), {
    ok: true,
    ingrediente: { id: 1, nome: 'Pão', quantidade: 0 },
  });
});

test('recusa nome ausente, vazio ou só espaços', () => {
  for (const nome of [undefined, '', '   ', 42]) {
    assert.deepEqual(cadastrarIngrediente(repositorio(), nome, 10), invalido('nome obrigatório'));
  }
});

test('recusa nome com 81 caracteres e aceita com 80', () => {
  assert.deepEqual(cadastrarIngrediente(repositorio(), 'x'.repeat(81), 10), invalido('nome com mais de 80 caracteres'));
  assert.equal(cadastrarIngrediente(repositorio(), 'x'.repeat(80), 10).ok, true);
});

test('recusa quantidade ausente, em texto, decimal ou negativa', () => {
  for (const quantidade of [undefined, '10', 1.5, -1]) {
    assert.deepEqual(cadastrarIngrediente(repositorio(), 'Carne (g)', quantidade), invalido(erroQuantidade));
  }
});

test('recusa nome repetido, ignorando maiúsculas e minúsculas', () => {
  const repo = repositorio();
  cadastrarIngrediente(repo, 'Carne (g)', 500);
  assert.deepEqual(cadastrarIngrediente(repo, 'carne (G)', 100), {
    ok: false,
    tipo: 'duplicado',
    erro: 'já existe um ingrediente com esse nome',
  });
});
