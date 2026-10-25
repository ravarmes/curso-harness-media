import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioAgenda } from '../repositorio.ts';
import type { Contexto } from '../agendar-consulta/agendar-consulta.ts';
import { cancelarConsulta } from '../cancelar-consulta/cancelar-consulta.ts';
import { registrarFalta } from './registrar-falta.ts';

const AGORA = Date.parse('2026-11-09T14:00:00-03:00');

// "Agora" é fixo em 09/11 14:00 em Brasília. As consultas entram direto no repositório,
// porque a agenda não deixa marcar no passado.
function novoCenario() {
  const ctx: Contexto = {
    repo: criarRepositorioAgenda(new DatabaseSync(':memory:')),
    agora: () => AGORA,
    pacienteExiste: () => true,
    profissionalExiste: () => true,
    expedienteDe: () => [],
  };
  const marcar = (inicio: string, fim: string, paciente_id = 3) =>
    ctx.repo.inserir({
      paciente_id,
      profissional_id: 1,
      inicio_utc: new Date(inicio).toISOString(),
      fim_utc: new Date(fim).toISOString(),
    }).id;
  return { ctx, marcar };
}
const recusa = (r: ReturnType<typeof registrarFalta>, tipo: string, mensagem?: string) => {
  assert.ok(!r.ok && r.erro.tipo === tipo, JSON.stringify(r));
  if (mensagem !== undefined) assert.equal(r.erro.mensagem, mensagem);
};

test('registra a falta de consulta que terminou há 1 min', () => {
  const { ctx, marcar } = novoCenario();
  const id = marcar('2026-11-09T12:59:00-03:00', '2026-11-09T13:59:00-03:00');
  assert.deepEqual(registrarFalta(ctx, String(id)), {
    ok: true,
    consulta: {
      id,
      paciente_id: 3,
      profissional_id: 1,
      inicio: '2026-11-09T12:59:00-03:00',
      fim: '2026-11-09T13:59:00-03:00',
      status: 'faltou',
    },
  });
  assert.equal(ctx.repo.porId(id)?.status, 'faltou');
});

test('registra a falta de consulta que termina exatamente agora', () => {
  const { ctx, marcar } = novoCenario();
  const id = marcar('2026-11-09T13:00:00-03:00', '2026-11-09T14:00:00-03:00');
  assert.ok(registrarFalta(ctx, String(id)).ok);
});

test('recusa (409) consulta que termina daqui a 1 min, e ela continua agendada', () => {
  const { ctx, marcar } = novoCenario();
  const id = marcar('2026-11-09T13:00:00-03:00', '2026-11-09T14:01:00-03:00');
  recusa(registrarFalta(ctx, String(id)), 'recusado', 'a consulta ainda não terminou');
  assert.equal(ctx.repo.porId(id)?.status, 'agendada');
});

test('recusa (409) consulta cancelada', () => {
  const { ctx, marcar } = novoCenario();
  const id = marcar('2026-11-12T09:00:00-03:00', '2026-11-12T10:00:00-03:00');
  assert.ok(cancelarConsulta(ctx, String(id), { quem: 'recepcao' }).ok);
  recusa(registrarFalta(ctx, String(id)), 'recusado', 'a consulta está cancelada');
  assert.equal(ctx.repo.porId(id)?.status, 'cancelada');
});

test('recusa (409) registrar a mesma falta duas vezes', () => {
  const { ctx, marcar } = novoCenario();
  const id = marcar('2026-11-09T12:00:00-03:00', '2026-11-09T13:00:00-03:00');
  assert.ok(registrarFalta(ctx, String(id)).ok);
  recusa(registrarFalta(ctx, String(id)), 'recusado', 'a falta já está registrada');
});

test('recusa consulta que não existe', () => {
  const { ctx } = novoCenario();
  assert.ok(!registrarFalta(ctx, '99').ok);
});

test('recusa (400) id malformado', () => {
  const { ctx } = novoCenario();
  for (const id of ['abc', '1.5', '', '-1']) recusa(registrarFalta(ctx, id), 'malformado');
});

test('a consulta com falta deixa de ocupar o horário do profissional e do paciente', () => {
  const { ctx, marcar } = novoCenario();
  const inicio = '2026-11-09T12:00:00-03:00';
  const fim = '2026-11-09T13:00:00-03:00';
  const id = marcar(inicio, fim);
  const [de, ate] = [new Date(inicio).toISOString(), new Date(fim).toISOString()];
  assert.ok(ctx.repo.profissionalOcupado(1, de, ate) && ctx.repo.pacienteOcupado(3, de, ate));
  assert.ok(registrarFalta(ctx, String(id)).ok);
  assert.equal(ctx.repo.profissionalOcupado(1, de, ate), false);
  assert.equal(ctx.repo.pacienteOcupado(3, de, ate), false);
});
