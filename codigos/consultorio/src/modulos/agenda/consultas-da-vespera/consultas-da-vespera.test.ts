import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioAgenda } from '../repositorio.ts';
import { agendarConsulta, type Contexto } from '../agendar-consulta/agendar-consulta.ts';
import { consultasDaVespera } from './consultas-da-vespera.ts';

function novoCenario() {
  const todoDia = Array.from({ length: 7 }, (_, dia_semana) => ({ dia_semana, inicio_min: 0, fim_min: 24 * 60 }));
  const ctx: Contexto = {
    repo: criarRepositorioAgenda(new DatabaseSync(':memory:')),
    pacienteExiste: () => true,
    profissionalExiste: () => true,
    expedienteDe: () => todoDia,
    agora: () => Date.parse('2026-11-01T00:00:00-03:00'),
  };
  const marcar = (paciente_id: number, profissional_id: number, inicio: string, fim: string) =>
    assert.ok(agendarConsulta(ctx, { paciente_id, profissional_id, inicio, fim }).ok);
  return { ctx, marcar };
}

const hoje = Date.parse('2026-11-09T10:00:00-03:00');

test('devolve as consultas de amanhã de todos os profissionais, em ordem', () => {
  const { ctx, marcar } = novoCenario();
  marcar(1, 1, '2026-11-10T15:00:00-03:00', '2026-11-10T16:00:00-03:00');
  marcar(2, 2, '2026-11-10T09:00:00-03:00', '2026-11-10T09:30:00-03:00');
  assert.deepEqual(consultasDaVespera(ctx, hoje), [
    { id: 2, paciente_id: 2, profissional_id: 2, inicio: '2026-11-10T09:00:00-03:00' },
    { id: 1, paciente_id: 1, profissional_id: 1, inicio: '2026-11-10T15:00:00-03:00' },
  ]);
});

test('o dia é o de Brasília: 23h30 de amanhã entra e 00h30 de depois de amanhã não', () => {
  const { ctx, marcar } = novoCenario();
  marcar(1, 1, '2026-11-10T23:30:00-03:00', '2026-11-10T23:50:00-03:00');
  marcar(2, 1, '2026-11-11T00:30:00-03:00', '2026-11-11T01:00:00-03:00');
  // 22h de hoje em Brasília já é o dia seguinte em UTC; "amanhã" continua sendo o dia 10.
  const r = consultasDaVespera(ctx, Date.parse('2026-11-09T22:00:00-03:00'));
  assert.deepEqual(
    r.map((c) => c.id),
    [1],
  );
});

test('consultas de hoje, de depois de amanhã e canceladas não entram', () => {
  const { ctx, marcar } = novoCenario();
  marcar(1, 1, '2026-11-09T15:00:00-03:00', '2026-11-09T16:00:00-03:00');
  marcar(2, 1, '2026-11-11T09:00:00-03:00', '2026-11-11T10:00:00-03:00');
  marcar(3, 1, '2026-11-10T09:00:00-03:00', '2026-11-10T10:00:00-03:00');
  marcar(4, 1, '2026-11-10T11:00:00-03:00', '2026-11-10T12:00:00-03:00');
  ctx.repo.cancelar(3);
  assert.deepEqual(
    consultasDaVespera(ctx, hoje).map((c) => c.id),
    [4],
  );
});

test('sem consultas amanhã devolve lista vazia', () => {
  const { ctx } = novoCenario();
  assert.deepEqual(consultasDaVespera(ctx, hoje), []);
});
