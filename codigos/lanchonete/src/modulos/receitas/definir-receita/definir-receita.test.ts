import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco } from '../../../compartilhado/banco.ts';
import { criarRepositorioDeReceitas } from '../repositorio.ts';
import { definirReceita } from './definir-receita.ts';

const NOMES: Record<number, string> = { 1: 'Pão', 2: 'Carne (g)' };
const deps = { existeItem: (id: number) => id === 1, nomeDoIngrediente: (id: number) => NOMES[id] };
const repositorio = () => criarRepositorioDeReceitas(abrirBanco(':memory:'));
const invalido = (erro: string) => ({ ok: false, tipo: 'invalido', erro });

test('define a receita, com nomes, em ordem de ingredienteId', () => {
  const repo = repositorio();
  const resultado = definirReceita(repo, deps, '1', [
    { ingredienteId: 2, quantidade: 150 },
    { ingredienteId: 1, quantidade: 1 },
  ]);
  assert.deepEqual(resultado, {
    ok: true,
    receita: {
      itemId: 1,
      ingredientes: [
        { ingredienteId: 1, nome: 'Pão', quantidade: 1 },
        { ingredienteId: 2, nome: 'Carne (g)', quantidade: 150 },
      ],
    },
  });
});

test('uma nova definição substitui a anterior, não soma', () => {
  const repo = repositorio();
  definirReceita(repo, deps, '1', [
    { ingredienteId: 1, quantidade: 1 },
    { ingredienteId: 2, quantidade: 150 },
  ]);
  assert.deepEqual(definirReceita(repo, deps, '1', [{ ingredienteId: 2, quantidade: 200 }]), {
    ok: true,
    receita: { itemId: 1, ingredientes: [{ ingredienteId: 2, nome: 'Carne (g)', quantidade: 200 }] },
  });
  assert.deepEqual(repo.listar(1), [{ ingredienteId: 2, quantidade: 200 }]);
});

test('recusa lista ausente, que não é lista ou vazia, e mantém a receita anterior', () => {
  const repo = repositorio();
  definirReceita(repo, deps, '1', [{ ingredienteId: 1, quantidade: 3 }]);
  for (const entrada of [undefined, 'pão', {}, []]) {
    assert.deepEqual(definirReceita(repo, deps, '1', entrada), invalido('receita deve ter ao menos um ingrediente'));
  }
  assert.deepEqual(repo.listar(1), [{ ingredienteId: 1, quantidade: 3 }]);
});

test('recusa quantidade ausente, em texto, decimal, zero ou negativa e mantém a receita anterior', () => {
  const repo = repositorio();
  definirReceita(repo, deps, '1', [{ ingredienteId: 1, quantidade: 3 }]);
  for (const quantidade of [undefined, '2', 1.5, 0, -1]) {
    const resultado = definirReceita(repo, deps, '1', [
      { ingredienteId: 1, quantidade: 1 },
      { ingredienteId: 2, quantidade },
    ]);
    assert.deepEqual(resultado, invalido('quantidade deve ser um inteiro positivo'));
  }
  assert.deepEqual(repo.listar(1), [{ ingredienteId: 1, quantidade: 3 }]);
});

test('recusa ingredienteId ausente, em texto ou decimal', () => {
  const repo = repositorio();
  for (const ingredienteId of [undefined, '1', 1.5]) {
    assert.deepEqual(
      definirReceita(repo, deps, '1', [{ ingredienteId, quantidade: 1 }]),
      invalido('ingredienteId deve ser um inteiro'),
    );
  }
});

test('recusa ingrediente repetido', () => {
  const repo = repositorio();
  const resultado = definirReceita(repo, deps, '1', [
    { ingredienteId: 1, quantidade: 1 },
    { ingredienteId: 1, quantidade: 2 },
  ]);
  assert.deepEqual(resultado, invalido('ingrediente repetido na receita'));
});

test('recusa ingrediente inexistente e mantém a receita anterior', () => {
  const repo = repositorio();
  definirReceita(repo, deps, '1', [{ ingredienteId: 1, quantidade: 3 }]);
  assert.deepEqual(
    definirReceita(repo, deps, '1', [{ ingredienteId: 999, quantidade: 1 }]),
    invalido('ingrediente 999 não encontrado'),
  );
  assert.deepEqual(repo.listar(1), [{ ingredienteId: 1, quantidade: 3 }]);
});

test('recusa item inexistente ou id que não é um inteiro positivo', () => {
  const repo = repositorio();
  for (const id of ['999', 'abc', '1.5', '-1', '0', '']) {
    assert.deepEqual(definirReceita(repo, deps, id, [{ ingredienteId: 1, quantidade: 1 }]), {
      ok: false,
      tipo: 'inexistente',
      erro: 'item não encontrado',
    });
  }
});
