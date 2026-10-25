import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco } from '../../../compartilhado/banco.ts';
import { criarRepositorioDeNotas } from '../repositorio.ts';
import { criarNota } from './criar-nota.ts';

const repositorio = () => criarRepositorioDeNotas(abrirBanco(':memory:'));

test('cria a nota sem os espaços das pontas', () => {
  assert.deepEqual(criarNota(repositorio(), '  comprar café  '), { ok: true, nota: { id: 1, texto: 'comprar café' } });
});

test('recusa texto vazio', () => {
  assert.deepEqual(criarNota(repositorio(), '   '), { ok: false, erro: 'texto obrigatório' });
});

test('recusa texto com mais de 280 caracteres', () => {
  assert.deepEqual(criarNota(repositorio(), 'x'.repeat(281)), { ok: false, erro: 'texto com mais de 280 caracteres' });
});
