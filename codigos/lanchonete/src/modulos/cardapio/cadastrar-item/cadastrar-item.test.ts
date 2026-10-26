import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco } from '../../../compartilhado/banco.ts';
import { criarRepositorioDoCardapio } from '../repositorio.ts';
import { cadastrarItem } from './cadastrar-item.ts';

const repositorio = () => criarRepositorioDoCardapio(abrirBanco(':memory:'));
const erroDePreco = 'preço deve ser um inteiro positivo, em centavos';

test('cadastra o item', () => {
  assert.deepEqual(cadastrarItem(repositorio(), 'X-Burger', 2250), {
    ok: true,
    item: { id: 1, nome: 'X-Burger', preco: 2250 },
  });
});

test('cadastra o item sem os espaços das pontas do nome', () => {
  const resultado = cadastrarItem(repositorio(), '  X-Burger  ', 2250);
  assert.deepEqual(resultado, { ok: true, item: { id: 1, nome: 'X-Burger', preco: 2250 } });
});

test('recusa nome ausente, vazio ou só com espaços', () => {
  for (const nome of [undefined, '', '   ', 42]) {
    assert.deepEqual(cadastrarItem(repositorio(), nome, 2250), {
      ok: false,
      tipo: 'invalido',
      erro: 'nome obrigatório',
    });
  }
});

test('recusa nome com mais de 80 caracteres', () => {
  assert.deepEqual(cadastrarItem(repositorio(), 'x'.repeat(81), 2250), {
    ok: false,
    tipo: 'invalido',
    erro: 'nome com mais de 80 caracteres',
  });
});

test('aceita nome com exatamente 80 caracteres', () => {
  assert.equal(cadastrarItem(repositorio(), 'x'.repeat(80), 2250).ok, true);
});

test('recusa preço ausente, em texto, decimal, zero ou negativo', () => {
  for (const preco of [undefined, '2250', 10.5, 0, -100]) {
    assert.deepEqual(cadastrarItem(repositorio(), 'X-Burger', preco), {
      ok: false,
      tipo: 'invalido',
      erro: erroDePreco,
    });
  }
});

test('recusa nome já cadastrado, sem diferenciar maiúsculas de minúsculas', () => {
  const repo = repositorio();
  cadastrarItem(repo, 'X-Burger', 2250);
  assert.deepEqual(cadastrarItem(repo, 'x-burger', 1000), {
    ok: false,
    tipo: 'duplicado',
    erro: 'já existe um item com esse nome',
  });
  assert.deepEqual(cadastrarItem(repo, 'PÃO de queijo', 500).ok, true);
  assert.deepEqual(cadastrarItem(repo, 'pão DE QUEIJO', 500), {
    ok: false,
    tipo: 'duplicado',
    erro: 'já existe um item com esse nome',
  });
});
