import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioEspera } from '../repositorio.ts';
import { entrarNaLista, type Contexto } from './entrar-na-lista.ts';

// Hoje é 2026-10-25 em Brasília. Pacientes 1 a 9 e profissionais 1 e 2 existem.
function novoCenario() {
  const ctx: Contexto = {
    repo: criarRepositorioEspera(new DatabaseSync(':memory:')),
    agora: () => Date.parse('2026-10-25T12:00:00-03:00'),
    pacienteExiste: (id) => id > 0 && id < 10,
    profissionalExiste: (id) => id === 1 || id === 2,
  };
  return ctx;
}

const pedido = { paciente_id: 1, profissional_id: 1, data: '2026-11-10' };

test('o paciente entra na fila e recebe a entrada, com a hora de chegada em Brasília', () => {
  const ctx = novoCenario();
  assert.deepEqual(entrarNaLista(ctx, pedido), {
    ok: true,
    entrada: {
      id: 1,
      paciente_id: 1,
      profissional_id: 1,
      data: '2026-11-10',
      entrou_em: '2026-10-25T12:00:00-03:00',
    },
  });
});

test('a data de hoje é aceita', () => {
  const r = entrarNaLista(novoCenario(), { ...pedido, data: '2026-10-25' });
  assert.ok(r.ok);
});

test('entrar de novo no mesmo profissional e dia é recusado', () => {
  const ctx = novoCenario();
  assert.ok(entrarNaLista(ctx, pedido).ok);
  const r = entrarNaLista(ctx, pedido);
  assert.ok(!r.ok);
  assert.equal(r.erro.tipo, 'recusado');
  assert.equal(r.erro.mensagem, 'O paciente já está na lista de espera deste profissional neste dia');
});

test('outro dia ou outro profissional não conta como duplicidade', () => {
  const ctx = novoCenario();
  assert.ok(entrarNaLista(ctx, pedido).ok);
  assert.ok(entrarNaLista(ctx, { ...pedido, data: '2026-11-11' }).ok);
  assert.ok(entrarNaLista(ctx, { ...pedido, profissional_id: 2 }).ok);
});

test('data anterior a hoje é recusada', () => {
  const r = entrarNaLista(novoCenario(), { ...pedido, data: '2026-10-24' });
  assert.ok(!r.ok);
  assert.equal(r.erro.tipo, 'recusado');
  assert.equal(r.erro.mensagem, 'A data da lista de espera não pode ser anterior a hoje');
});

test('paciente que não existe é inexistente', () => {
  const r = entrarNaLista(novoCenario(), { ...pedido, paciente_id: 99 });
  assert.ok(!r.ok);
  assert.equal(r.erro.tipo, 'inexistente');
  assert.equal(r.erro.mensagem, 'Paciente não encontrado');
});

test('profissional que não existe é inexistente', () => {
  const r = entrarNaLista(novoCenario(), { ...pedido, profissional_id: 99 });
  assert.ok(!r.ok);
  assert.equal(r.erro.tipo, 'inexistente');
  assert.equal(r.erro.mensagem, 'Profissional não encontrado');
});

test('paciente_id e profissional_id ausentes ou inválidos são malformado', () => {
  const ctx = novoCenario();
  for (const valor of [undefined, 'a', 1.5, 0, -1]) {
    const p = entrarNaLista(ctx, { ...pedido, paciente_id: valor });
    assert.ok(!p.ok && p.erro.tipo === 'malformado');
    assert.equal(p.erro.mensagem, 'paciente_id deve ser um número inteiro positivo');
    const f = entrarNaLista(ctx, { ...pedido, profissional_id: valor });
    assert.ok(!f.ok && f.erro.tipo === 'malformado');
    assert.equal(f.erro.mensagem, 'profissional_id deve ser um número inteiro positivo');
  }
});

test('data ausente ou fora do formato é malformado', () => {
  const ctx = novoCenario();
  for (const data of [undefined, '10/11/2026', '2026-02-30']) {
    const r = entrarNaLista(ctx, { ...pedido, data });
    assert.ok(!r.ok && r.erro.tipo === 'malformado');
    assert.equal(r.erro.mensagem, 'A data deve estar no formato AAAA-MM-DD');
  }
});

test('corpo que não é objeto é malformado', () => {
  const r = entrarNaLista(novoCenario(), undefined);
  assert.ok(!r.ok && r.erro.tipo === 'malformado');
});
