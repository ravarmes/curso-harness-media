import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco } from '../../../compartilhado/banco.ts';
import { criarRepositorioDeReceitas } from '../repositorio.ts';
import { consultarReceita } from './consultar-receita.ts';

const nomes: Record<number, string> = { 1: 'Pão', 2: 'Carne (g)' };
const depsCom = (nomesAtuais: Record<number, string>) => ({
  existeItem: (id: number) => id === 1,
  nomeDoIngrediente: (id: number) => nomesAtuais[id],
});
const repositorio = () => criarRepositorioDeReceitas(abrirBanco(':memory:'));

test('devolve a receita gravada, com o nome atual dos ingredientes', () => {
  const repo = repositorio();
  repo.substituir(1, [
    { ingredienteId: 2, quantidade: 150 },
    { ingredienteId: 1, quantidade: 1 },
  ]);
  assert.deepEqual(consultarReceita(repo, depsCom(nomes), '1'), {
    ok: true,
    receita: {
      itemId: 1,
      ingredientes: [
        { ingredienteId: 1, nome: 'Pão', quantidade: 1 },
        { ingredienteId: 2, nome: 'Carne (g)', quantidade: 150 },
      ],
    },
  });
  const renomeados = consultarReceita(repo, depsCom({ 1: 'Pão brioche', 2: 'Carne (g)' }), '1');
  assert.equal(renomeados.ok && renomeados.receita.ingredientes[0]?.nome, 'Pão brioche');
});

test('item existente sem receita devolve lista vazia', () => {
  assert.deepEqual(consultarReceita(repositorio(), depsCom(nomes), '1'), {
    ok: true,
    receita: { itemId: 1, ingredientes: [] },
  });
});

test('recusa item inexistente ou id que não é um inteiro positivo', () => {
  for (const id of ['999', 'abc', '1.5', '-1', '0', '']) {
    assert.deepEqual(consultarReceita(repositorio(), depsCom(nomes), id), { ok: false, erro: 'item não encontrado' });
  }
});
