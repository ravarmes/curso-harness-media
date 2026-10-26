import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioEspera } from '../repositorio.ts';
import { entrarNaLista, type Contexto } from '../entrar-na-lista/entrar-na-lista.ts';
import { sairDaLista } from './sair-da-lista.ts';

function novoCenario() {
  const ctx: Contexto = {
    repo: criarRepositorioEspera(new DatabaseSync(':memory:')),
    agora: () => Date.parse('2026-10-25T12:00:00-03:00'),
    pacienteExiste: (id) => id > 0 && id < 10,
    profissionalExiste: (id) => id === 1 || id === 2,
  };
  const entrar = (paciente_id: number) =>
    assert.ok(entrarNaLista(ctx, { paciente_id, profissional_id: 1, data: '2026-11-10' }).ok);
  return { ctx, entrar };
}

test('sair devolve a entrada removida e ela some da fila', () => {
  const { ctx, entrar } = novoCenario();
  entrar(1);
  assert.deepEqual(sairDaLista(ctx, '1'), {
    ok: true,
    entrada: {
      id: 1,
      paciente_id: 1,
      profissional_id: 1,
      data: '2026-11-10',
      entrou_em: '2026-10-25T12:00:00-03:00',
    },
  });
  assert.deepEqual(ctx.repo.daFila(1, '2026-11-10'), []);
});

test('sair só tira a entrada pedida', () => {
  const { ctx, entrar } = novoCenario();
  entrar(1);
  entrar(2);
  assert.ok(sairDaLista(ctx, '1').ok);
  assert.deepEqual(
    ctx.repo.daFila(1, '2026-11-10').map((e) => e.paciente_id),
    [2],
  );
});

test('sair de novo, ou de um id que nunca existiu, é inexistente', () => {
  const { ctx, entrar } = novoCenario();
  entrar(1);
  assert.ok(sairDaLista(ctx, '1').ok);
  for (const id of ['1', '999']) {
    const r = sairDaLista(ctx, id);
    assert.ok(!r.ok);
    assert.equal(r.erro.tipo, 'inexistente');
    assert.equal(r.erro.mensagem, 'Entrada da lista de espera não encontrada');
  }
});

test('id que não é inteiro positivo é malformado', () => {
  const { ctx } = novoCenario();
  for (const id of ['abc', '0', '-1', '1.5']) {
    const r = sairDaLista(ctx, id);
    assert.ok(!r.ok);
    assert.equal(r.erro.tipo, 'malformado');
    assert.equal(r.erro.mensagem, 'O id da entrada deve ser um número inteiro');
  }
});

test('quem sai e entra de novo vai para o fim da fila', () => {
  const { ctx, entrar } = novoCenario();
  entrar(1);
  entrar(2);
  assert.ok(sairDaLista(ctx, '1').ok);
  entrar(1);
  assert.deepEqual(
    ctx.repo.daFila(1, '2026-11-10').map((e) => e.paciente_id),
    [2, 1],
  );
});
