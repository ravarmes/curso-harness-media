import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioEspera } from '../repositorio.ts';
import { entrarNaLista, type Contexto } from '../entrar-na-lista/entrar-na-lista.ts';
import { consultarLista } from './consultar-lista.ts';

function novoCenario() {
  const ctx: Contexto = {
    repo: criarRepositorioEspera(new DatabaseSync(':memory:')),
    agora: () => Date.parse('2026-10-25T12:00:00-03:00'),
    pacienteExiste: (id) => id > 0 && id < 10,
    profissionalExiste: (id) => id === 1 || id === 2,
  };
  const entrar = (paciente_id: number, profissional_id = 1, data = '2026-11-10') =>
    assert.ok(entrarNaLista(ctx, { paciente_id, profissional_id, data }).ok);
  return { ctx, entrar };
}

test('a fila vem em ordem de chegada, com posição a partir de 1', () => {
  const { ctx, entrar } = novoCenario();
  entrar(3);
  entrar(1);
  entrar(2);
  assert.deepEqual(consultarLista(ctx, '1', '2026-11-10'), {
    ok: true,
    lista: {
      profissional_id: 1,
      data: '2026-11-10',
      fila: [
        { posicao: 1, id: 1, paciente_id: 3, entrou_em: '2026-10-25T12:00:00-03:00' },
        { posicao: 2, id: 2, paciente_id: 1, entrou_em: '2026-10-25T12:00:00-03:00' },
        { posicao: 3, id: 3, paciente_id: 2, entrou_em: '2026-10-25T12:00:00-03:00' },
      ],
    },
  });
});

test('não mostra outro dia nem outro profissional', () => {
  const { ctx, entrar } = novoCenario();
  entrar(1);
  entrar(2, 1, '2026-11-11');
  entrar(3, 2);
  const r = consultarLista(ctx, '1', '2026-11-10');
  assert.ok(r.ok);
  assert.deepEqual(
    r.lista.fila.map((e) => e.paciente_id),
    [1],
  );
});

test('profissional sem ninguém na fila devolve lista vazia', () => {
  const { ctx } = novoCenario();
  const r = consultarLista(ctx, '1', '2026-11-10');
  assert.ok(r.ok);
  assert.deepEqual(r.lista.fila, []);
});

test('dia passado também pode ser consultado', () => {
  const { ctx } = novoCenario();
  const r = consultarLista(ctx, '1', '2026-01-05');
  assert.ok(r.ok);
  assert.deepEqual(r.lista.fila, []);
});

test('profissional que não existe é inexistente', () => {
  const r = consultarLista(novoCenario().ctx, '999', '2026-11-10');
  assert.ok(!r.ok);
  assert.equal(r.erro.tipo, 'inexistente');
  assert.equal(r.erro.mensagem, 'Profissional não encontrado');
});

test('id do profissional ou data malformados são malformado', () => {
  const { ctx } = novoCenario();
  const id = consultarLista(ctx, 'abc', '2026-11-10');
  assert.ok(!id.ok && id.erro.tipo === 'malformado');
  assert.equal(id.erro.mensagem, 'O id do profissional deve ser um número inteiro');
  for (const data of ['10/11/2026', '2026-02-30', '2026-11-10T00:00:00-03:00']) {
    const r = consultarLista(ctx, '1', data);
    assert.ok(!r.ok && r.erro.tipo === 'malformado');
    assert.equal(r.erro.mensagem, 'A data deve estar no formato AAAA-MM-DD');
  }
});
