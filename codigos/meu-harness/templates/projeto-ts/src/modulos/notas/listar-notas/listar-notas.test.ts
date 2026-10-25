import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco } from '../../../compartilhado/banco.ts';
import { criarRepositorioDeNotas } from '../repositorio.ts';
import { listarNotas } from './listar-notas.ts';

test('lista as notas na ordem em que foram criadas', () => {
  const repo = criarRepositorioDeNotas(abrirBanco(':memory:'));
  repo.inserir('primeira');
  repo.inserir('segunda');
  assert.deepEqual(listarNotas(repo).map((n) => n.texto), ['primeira', 'segunda']);
});
