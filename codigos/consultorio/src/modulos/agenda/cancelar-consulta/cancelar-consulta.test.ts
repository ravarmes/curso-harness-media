import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioAgenda } from '../repositorio.ts';
import { agendarConsulta, type Contexto } from '../agendar-consulta/agendar-consulta.ts';
import { cancelarConsulta } from './cancelar-consulta.ts';

const AGORA = Date.parse('2026-11-09T14:00:00-03:00');

// Profissionais 1 e 2 trabalham todo dia, o dia inteiro. "Agora" é fixo em 09/11 14:00 em Brasília.
function novoCenario() {
  const todoDia = Array.from({ length: 7 }, (_, dia_semana) => ({ dia_semana, inicio_min: 0, fim_min: 24 * 60 }));
  const ctx: Contexto = {
    repo: criarRepositorioAgenda(new DatabaseSync(':memory:')),
    agora: () => AGORA,
    pacienteExiste: (id) => id > 0 && id < 10,
    profissionalExiste: (id) => id === 1 || id === 2,
    expedienteDe: () => todoDia,
  };
  // Marca a consulta do paciente 3 com o profissional 1 e devolve o id.
  const marcar = (inicio: string, fim: string) => {
    const r = agendarConsulta(ctx, { paciente_id: 3, profissional_id: 1, inicio, fim });
    assert.ok(r.ok);
    return r.consulta.id;
  };
  return { ctx, marcar };
}
const recusa = (r: ReturnType<typeof cancelarConsulta>, tipo: string, mensagem?: string) => {
  assert.ok(!r.ok && r.erro.tipo === tipo, JSON.stringify(r));
  if (mensagem !== undefined) assert.equal(r.erro.mensagem, mensagem);
};
const paciente = (paciente_id: unknown = 3) => ({ quem: 'paciente', paciente_id });

test('o paciente cancela a própria consulta exatamente 24 h antes', () => {
  const { ctx, marcar } = novoCenario();
  const id = marcar('2026-11-10T14:00:00-03:00', '2026-11-10T15:00:00-03:00');
  assert.deepEqual(cancelarConsulta(ctx, String(id), paciente()), {
    ok: true,
    consulta: {
      id,
      paciente_id: 3,
      profissional_id: 1,
      inicio: '2026-11-10T14:00:00-03:00',
      fim: '2026-11-10T15:00:00-03:00',
      status: 'cancelada',
    },
  });
  assert.equal(ctx.repo.porId(id)?.status, 'cancelada');
});

test('recusa (409) o paciente a 23 h 59 min do início, e a consulta continua agendada', () => {
  const { ctx, marcar } = novoCenario();
  const id = marcar('2026-11-10T13:59:00-03:00', '2026-11-10T15:00:00-03:00');
  recusa(cancelarConsulta(ctx, String(id), paciente()), 'recusado', 'o paciente só cancela até 24 h antes');
  assert.equal(ctx.repo.porId(id)?.status, 'agendada');
});

test('a recepção cancela a 23 h 59 min do início', () => {
  const { ctx, marcar } = novoCenario();
  const id = marcar('2026-11-10T13:59:00-03:00', '2026-11-10T15:00:00-03:00');
  const r = cancelarConsulta(ctx, String(id), { quem: 'recepcao' });
  assert.ok(r.ok && r.consulta.status === 'cancelada');
});

test('recusa (409) cancelar consulta que já começou, até a recepção', () => {
  const { ctx, marcar } = novoCenario();
  const id = marcar('2026-11-09T13:00:00-03:00', '2026-11-09T15:00:00-03:00');
  recusa(cancelarConsulta(ctx, String(id), { quem: 'recepcao' }), 'recusado', 'a consulta já começou');
  recusa(cancelarConsulta(ctx, String(id), paciente()), 'recusado', 'a consulta já começou');
});

test('recusa (409) paciente que cancela consulta de outro', () => {
  const { ctx, marcar } = novoCenario();
  const id = marcar('2026-11-12T09:00:00-03:00', '2026-11-12T10:00:00-03:00');
  recusa(cancelarConsulta(ctx, String(id), paciente(4)), 'recusado', 'a consulta não pertence a esse paciente');
  assert.equal(ctx.repo.porId(id)?.status, 'agendada');
});

test('recusa (409) cancelar duas vezes', () => {
  const { ctx, marcar } = novoCenario();
  const id = marcar('2026-11-12T09:00:00-03:00', '2026-11-12T10:00:00-03:00');
  assert.ok(cancelarConsulta(ctx, String(id), paciente()).ok);
  recusa(cancelarConsulta(ctx, String(id), paciente()), 'recusado', 'a consulta já está cancelada');
  recusa(cancelarConsulta(ctx, String(id), { quem: 'recepcao' }), 'recusado', 'a consulta já está cancelada');
});

test('recusa (404) consulta que não existe', () => {
  const { ctx } = novoCenario();
  recusa(cancelarConsulta(ctx, '99', paciente()), 'inexistente', 'Consulta não encontrada');
});

test('recusa (400) dados malformados', () => {
  const { ctx, marcar } = novoCenario();
  const id = String(marcar('2026-11-12T09:00:00-03:00', '2026-11-12T10:00:00-03:00'));
  const ruins: unknown[] = [
    undefined,
    null,
    {},
    { quem: 'medico' },
    { quem: 'paciente' }, // sem paciente_id
    paciente('3'),
    paciente(1.5),
    paciente(0),
  ];
  for (const dados of ruins) recusa(cancelarConsulta(ctx, id, dados), 'malformado');
  recusa(cancelarConsulta(ctx, 'abc', paciente()), 'malformado');
  assert.equal(ctx.repo.porId(Number(id))?.status, 'agendada');
});
