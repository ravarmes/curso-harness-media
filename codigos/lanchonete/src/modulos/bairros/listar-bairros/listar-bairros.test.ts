import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco } from '../../../compartilhado/banco.ts';
import { criarRepositorioDosBairros } from '../repositorio.ts';
import { listarBairros } from './listar-bairros.ts';

test('devolve lista vazia com o banco vazio', () => {
  assert.deepEqual(listarBairros(criarRepositorioDosBairros(abrirBanco(':memory:'))), []);
});

test('devolve os bairros em ordem de id', () => {
  const repo = criarRepositorioDosBairros(abrirBanco(':memory:'));
  repo.inserir('Centro', 500);
  repo.inserir('Vila Nova', 0);
  assert.deepEqual(listarBairros(repo), [
    { id: 1, nome: 'Centro', taxa: 500 },
    { id: 2, nome: 'Vila Nova', taxa: 0 },
  ]);
});
