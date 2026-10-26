import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco } from '../../../compartilhado/banco.ts';
import { criarRepositorioDosCupons } from '../repositorio.ts';
import { cadastrarCupom } from './cadastrar-cupom.ts';

const repositorio = () => criarRepositorioDosCupons(abrirBanco(':memory:'));
const invalido = (erro: string) => ({ ok: false, tipo: 'invalido', erro });
const erroPercentual = 'percentual deve ser um inteiro de 1 a 100';

test('cadastra o cupom com o percentual', () => {
  assert.deepEqual(cadastrarCupom(repositorio(), 'BEMVINDO10', 10), {
    ok: true,
    cupom: { id: 1, codigo: 'BEMVINDO10', percentual: 10 },
  });
});

test('apara o código, converte para maiúsculas e aceita 100%', () => {
  assert.deepEqual(cadastrarCupom(repositorio(), '  bemvindo10  ', 100), {
    ok: true,
    cupom: { id: 1, codigo: 'BEMVINDO10', percentual: 100 },
  });
});

test('recusa código ausente, vazio ou só espaços', () => {
  for (const codigo of [undefined, '', '   ', 42]) {
    assert.deepEqual(cadastrarCupom(repositorio(), codigo, 10), invalido('código obrigatório'));
  }
});

test('recusa código com 31 caracteres e aceita com 30', () => {
  assert.deepEqual(cadastrarCupom(repositorio(), 'X'.repeat(31), 10), invalido('código com mais de 30 caracteres'));
  assert.equal(cadastrarCupom(repositorio(), 'X'.repeat(30), 10).ok, true);
});

test('recusa código com caracteres fora de letras, números e hífen', () => {
  for (const codigo of ['DEZ POR CENTO', 'DEZ%', 'PROMOÇÃO', 'A_B']) {
    assert.deepEqual(cadastrarCupom(repositorio(), codigo, 10), invalido('código aceita só letras, números e hífen'));
  }
  assert.equal(cadastrarCupom(repositorio(), 'VERAO-2026', 10).ok, true);
});

test('recusa percentual ausente, em texto, decimal, zero, negativo ou acima de 100', () => {
  for (const percentual of [undefined, '10', 7.5, 0, -1, 101]) {
    assert.deepEqual(cadastrarCupom(repositorio(), 'BEMVINDO10', percentual), invalido(erroPercentual));
  }
});

test('recusa código repetido, ignorando maiúsculas e minúsculas, sem mudar o percentual', () => {
  const repo = repositorio();
  cadastrarCupom(repo, 'BEMVINDO10', 10);
  assert.deepEqual(cadastrarCupom(repo, 'bemvindo10', 50), {
    ok: false,
    tipo: 'duplicado',
    erro: 'já existe um cupom com esse código',
  });
  assert.deepEqual(repo.buscarPorCodigo('BEMVINDO10'), { id: 1, codigo: 'BEMVINDO10', percentual: 10 });
});

test('valida o corpo antes de checar duplicidade', () => {
  const repo = repositorio();
  cadastrarCupom(repo, 'BEMVINDO10', 10);
  assert.deepEqual(cadastrarCupom(repo, 'bemvindo10', 0), invalido(erroPercentual));
});
