import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco } from '../../../compartilhado/banco.ts';
import { criarRepositorioDosCupons } from '../repositorio.ts';
import { consultarCupom } from './consultar-cupom.ts';

test('devolve o cupom pelo código', () => {
  const repo = criarRepositorioDosCupons(abrirBanco(':memory:'));
  repo.inserir('BEMVINDO10', 10);
  assert.deepEqual(consultarCupom(repo, 'BEMVINDO10'), {
    ok: true,
    cupom: { id: 1, codigo: 'BEMVINDO10', percentual: 10 },
  });
});

test('ignora maiúsculas e minúsculas e espaços ao redor do código', () => {
  const repo = criarRepositorioDosCupons(abrirBanco(':memory:'));
  repo.inserir('BEMVINDO10', 10);
  for (const codigo of ['bemvindo10', ' BemVindo10 ']) {
    assert.deepEqual(consultarCupom(repo, codigo), {
      ok: true,
      cupom: { id: 1, codigo: 'BEMVINDO10', percentual: 10 },
    });
  }
});

test('recusa código inexistente', () => {
  const repo = criarRepositorioDosCupons(abrirBanco(':memory:'));
  assert.deepEqual(consultarCupom(repo, 'INEXISTENTE'), { ok: false, erro: 'cupom não encontrado' });
});
