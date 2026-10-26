import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco } from '../../../compartilhado/banco.ts';
import { criarRepositorioDosBairros } from '../repositorio.ts';
import { cadastrarBairro } from './cadastrar-bairro.ts';

const repositorio = () => criarRepositorioDosBairros(abrirBanco(':memory:'));
const invalido = (erro: string) => ({ ok: false, tipo: 'invalido', erro });
const erroTaxa = 'taxa deve ser um inteiro maior ou igual a zero, em centavos';

test('cadastra o bairro com a taxa', () => {
  assert.deepEqual(cadastrarBairro(repositorio(), 'Centro', 500), {
    ok: true,
    bairro: { id: 1, nome: 'Centro', taxa: 500 },
  });
});

test('apara os espaços do nome e aceita taxa zero', () => {
  assert.deepEqual(cadastrarBairro(repositorio(), '  Vila Nova  ', 0), {
    ok: true,
    bairro: { id: 1, nome: 'Vila Nova', taxa: 0 },
  });
});

test('recusa nome ausente, vazio ou só espaços', () => {
  for (const nome of [undefined, '', '   ', 42]) {
    assert.deepEqual(cadastrarBairro(repositorio(), nome, 500), invalido('nome obrigatório'));
  }
});

test('recusa nome com 81 caracteres e aceita com 80', () => {
  assert.deepEqual(cadastrarBairro(repositorio(), 'x'.repeat(81), 500), invalido('nome com mais de 80 caracteres'));
  assert.equal(cadastrarBairro(repositorio(), 'x'.repeat(80), 500).ok, true);
});

test('recusa taxa ausente, em texto, decimal ou negativa', () => {
  for (const taxa of [undefined, '500', 5.5, -1]) {
    assert.deepEqual(cadastrarBairro(repositorio(), 'Centro', taxa), invalido(erroTaxa));
  }
});

test('recusa nome repetido, ignorando maiúsculas e minúsculas, sem mudar a taxa', () => {
  const repo = repositorio();
  cadastrarBairro(repo, 'Centro', 500);
  assert.deepEqual(cadastrarBairro(repo, 'centro', 100), {
    ok: false,
    tipo: 'duplicado',
    erro: 'já existe um bairro com esse nome',
  });
  assert.deepEqual(repo.listar(), [{ id: 1, nome: 'Centro', taxa: 500 }]);
});
