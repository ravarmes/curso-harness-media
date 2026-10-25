import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioAgenda } from '../repositorio.ts';
import { agendarConsulta, type Contexto } from '../agendar-consulta/agendar-consulta.ts';
import { obterAgendaDoDia } from './obter-agenda-do-dia.ts';

// Profissionais 1 e 2 trabalham todo dia, o dia inteiro.
function novoCenario() {
  const todoDia = Array.from({ length: 7 }, (_, dia_semana) => ({ dia_semana, inicio_min: 0, fim_min: 24 * 60 }));
  const ctx: Contexto = {
    repo: criarRepositorioAgenda(new DatabaseSync(':memory:')),
    pacienteExiste: (id) => id > 0 && id < 10,
    profissionalExiste: (id) => id === 1 || id === 2,
    expedienteDe: () => todoDia,
    agora: () => Date.now(),
  };
  const marcar = (paciente_id: number, profissional_id: number, inicio: string, fim: string) =>
    assert.ok(agendarConsulta(ctx, { paciente_id, profissional_id, inicio, fim }).ok);
  return { ctx, marcar };
}

test('lista as consultas do dia em ordem de horário, só do profissional pedido', () => {
  const { ctx, marcar } = novoCenario();
  marcar(1, 1, '2026-11-10T15:00:00-03:00', '2026-11-10T16:00:00-03:00');
  marcar(2, 1, '2026-11-10T09:00:00-03:00', '2026-11-10T09:30:00-03:00');
  marcar(3, 2, '2026-11-10T09:00:00-03:00', '2026-11-10T10:00:00-03:00');
  assert.deepEqual(obterAgendaDoDia(ctx, '1', '2026-11-10'), {
    ok: true,
    agenda: {
      profissional_id: 1,
      data: '2026-11-10',
      consultas: [
        { id: 2, paciente_id: 2, inicio: '2026-11-10T09:00:00-03:00', fim: '2026-11-10T09:30:00-03:00' },
        { id: 1, paciente_id: 1, inicio: '2026-11-10T15:00:00-03:00', fim: '2026-11-10T16:00:00-03:00' },
      ],
    },
  });
});

test('o dia é o de Brasília: 23h de um dia não vaza para o outro, mesmo sendo o dia seguinte em UTC', () => {
  const { ctx, marcar } = novoCenario();
  marcar(1, 1, '2026-11-10T23:00:00-03:00', '2026-11-10T23:30:00-03:00'); // 11/11 02:00 UTC
  marcar(2, 1, '2026-11-11T00:00:00-03:00', '2026-11-11T01:00:00-03:00');
  const consultas = (data: string) => {
    const r = obterAgendaDoDia(ctx, '1', data);
    assert.ok(r.ok);
    return r.agenda.consultas.map((c) => c.id);
  };
  assert.deepEqual(consultas('2026-11-10'), [1]);
  assert.deepEqual(consultas('2026-11-11'), [2]);
});

test('dia sem consultas devolve lista vazia', () => {
  const { ctx } = novoCenario();
  const r = obterAgendaDoDia(ctx, '1', '2026-11-10');
  assert.ok(r.ok && r.agenda.consultas.length === 0);
});

test('profissional que não existe é inexistente', () => {
  const { ctx } = novoCenario();
  const r = obterAgendaDoDia(ctx, '999', '2026-11-10');
  assert.ok(!r.ok && r.erro.tipo === 'inexistente');
});

test('id ou data malformados são malformado', () => {
  const { ctx } = novoCenario();
  for (const [id, data] of [['abc', '2026-11-10'], ['1', '10/11/2026'], ['1', '2026-02-30'], ['1', '2026-11-10T00:00:00-03:00']]) {
    const r = obterAgendaDoDia(ctx, id, data);
    assert.ok(!r.ok && r.erro.tipo === 'malformado', `${id} ${data}`);
  }
});

test('a consulta cancelada não aparece na agenda do dia', () => {
  const { ctx, marcar } = novoCenario();
  marcar(1, 1, '2026-11-10T09:00:00-03:00', '2026-11-10T10:00:00-03:00');
  marcar(2, 1, '2026-11-10T11:00:00-03:00', '2026-11-10T12:00:00-03:00');
  ctx.repo.cancelar(1);
  const r = obterAgendaDoDia(ctx, '1', '2026-11-10');
  assert.ok(r.ok);
  assert.deepEqual(r.agenda.consultas.map((c) => c.id), [2]);
});
