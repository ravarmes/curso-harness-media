import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco } from '../../../compartilhado/banco.ts';
import { criarRepositorioDosBairros } from '../repositorio.ts';
import { consultarBairro } from './consultar-bairro.ts';

test('devolve o bairro com a taxa', () => {
  const repo = criarRepositorioDosBairros(abrirBanco(':memory:'));
  repo.inserir('Centro', 500);
  assert.deepEqual(consultarBairro(repo, '1'), { ok: true, bairro: { id: 1, nome: 'Centro', taxa: 500 } });
});

test('recusa id inexistente ou que não é número', () => {
  const repo = criarRepositorioDosBairros(abrirBanco(':memory:'));
  for (const id of ['999', 'abc', '0', '-1', '1.5']) {
    assert.deepEqual(consultarBairro(repo, id), { ok: false, erro: 'bairro não encontrado' });
  }
});
