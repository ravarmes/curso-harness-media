import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioAgenda } from '../repositorio.ts';
import { agendarConsulta, type Contexto } from '../agendar-consulta/agendar-consulta.ts';
import { obterAgendaDoDia } from '../obter-agenda-do-dia/obter-agenda-do-dia.ts';
import { cancelarConsulta } from '../cancelar-consulta/cancelar-consulta.ts';
import { remarcarConsulta } from './remarcar-consulta.ts';

const AGORA = Date.parse('2026-11-09T14:00:00-03:00');

// Profissionais 1 e 2 trabalham de segunda a sexta, das 8h às 18h. "Agora" é segunda, 09/11 14:00.
function novoCenario() {
  const semana = Array.from({ length: 5 }, (_, dia_semana) => ({ dia_semana, inicio_min: 8 * 60, fim_min: 18 * 60 }));
  const ctx: Contexto = {
    repo: criarRepositorioAgenda(new DatabaseSync(':memory:')),
    agora: () => AGORA,
    pacienteExiste: (id) => id > 0 && id < 10,
    profissionalExiste: (id) => id === 1 || id === 2,
    expedienteDe: () => semana,
  };
  const marcar = (inicio: string, fim: string, paciente_id = 3, profissional_id = 1) => {
    const r = agendarConsulta(ctx, { paciente_id, profissional_id, inicio, fim });
    assert.ok(r.ok, JSON.stringify(r));
    return r.consulta.id;
  };
  // Consulta 10 do enunciado: paciente 3, profissional 1, quarta 11/11 às 9h.
  const id = marcar('2026-11-11T09:00:00-03:00', '2026-11-11T09:30:00-03:00');
  return { ctx, marcar, id };
}
const recusa = (r: ReturnType<typeof remarcarConsulta>, tipo: string, mensagem?: string) => {
  assert.ok(!r.ok && r.erro.tipo === tipo, JSON.stringify(r));
  if (mensagem !== undefined) assert.equal(r.erro.mensagem, mensagem);
};
const novo = (inicio: string, fim: string) => ({ inicio, fim });
const paciente = (paciente_id: unknown = 3) => ({ quem: 'paciente', paciente_id });
const JANTAR = novo('2026-11-12T10:00:00-03:00', '2026-11-12T10:30:00-03:00');

test('o paciente remarca a própria consulta: mesmo id, novo horário, status agendada', () => {
  const { ctx, id } = novoCenario();
  assert.deepEqual(remarcarConsulta(ctx, String(id), { ...paciente(), ...JANTAR }), {
    ok: true,
    consulta: {
      id,
      paciente_id: 3,
      profissional_id: 1,
      inicio: '2026-11-12T10:00:00-03:00',
      fim: '2026-11-12T10:30:00-03:00',
      status: 'agendada',
    },
  });
});

test('o horário antigo fica livre e a agenda dos dias acompanha a mudança', () => {
  const { ctx, marcar, id } = novoCenario();
  assert.ok(remarcarConsulta(ctx, String(id), { ...paciente(), ...JANTAR }).ok);
  // Outro paciente agenda no horário antigo.
  marcar('2026-11-11T09:00:00-03:00', '2026-11-11T09:30:00-03:00', 4);
  const dia12 = obterAgendaDoDia(ctx, '1', '2026-11-12');
  const dia11 = obterAgendaDoDia(ctx, '1', '2026-11-11');
  assert.ok(dia12.ok && dia11.ok);
  assert.deepEqual(JSON.stringify(dia12).includes(`"id":${id}`), true);
  assert.equal(JSON.stringify(dia11).includes(`"id":${id}`), false);
});

test('a recepção remarca', () => {
  const { ctx, id } = novoCenario();
  assert.ok(remarcarConsulta(ctx, String(id), { quem: 'recepcao', ...JANTAR }).ok);
});

test('remarcar para um intervalo que se sobrepõe ao da própria consulta é permitido', () => {
  const { ctx, id } = novoCenario();
  const r = remarcarConsulta(ctx, String(id), {
    quem: 'recepcao',
    ...novo('2026-11-11T09:15:00-03:00', '2026-11-11T09:45:00-03:00'),
  });
  assert.ok(r.ok && r.consulta.inicio === '2026-11-11T09:15:00-03:00');
});

test('recusa (409) horário em que o profissional já tem consulta, e a consulta não muda', () => {
  const { ctx, marcar, id } = novoCenario();
  marcar('2026-11-12T10:00:00-03:00', '2026-11-12T10:30:00-03:00', 4);
  recusa(
    remarcarConsulta(ctx, String(id), { ...paciente(), ...JANTAR }),
    'recusado',
    'O profissional já tem consulta nesse horário',
  );
  assert.equal(ctx.repo.porId(id)?.inicio_utc, '2026-11-11T12:00:00.000Z');
});

test('recusa (409) horário em que o paciente já tem consulta com outro profissional', () => {
  const { ctx, marcar, id } = novoCenario();
  marcar('2026-11-12T10:00:00-03:00', '2026-11-12T10:30:00-03:00', 3, 2);
  recusa(
    remarcarConsulta(ctx, String(id), { ...paciente(), ...JANTAR }),
    'recusado',
    'O paciente já tem consulta nesse horário',
  );
});

test('recusa (409) fora do expediente: sábado e antes das 8h', () => {
  const { ctx, id } = novoCenario();
  const msg = 'A consulta está fora do expediente do profissional';
  recusa(
    remarcarConsulta(ctx, String(id), {
      ...paciente(),
      ...novo('2026-11-14T10:00:00-03:00', '2026-11-14T10:30:00-03:00'),
    }),
    'recusado',
    msg,
  );
  recusa(
    remarcarConsulta(ctx, String(id), {
      ...paciente(),
      ...novo('2026-11-12T07:30:00-03:00', '2026-11-12T08:00:00-03:00'),
    }),
    'recusado',
    msg,
  );
});

test('o paciente só remarca até 24 h antes; com exatamente 24 h pode', () => {
  const { ctx, marcar } = novoCenario();
  const tarde = marcar('2026-11-10T13:59:00-03:00', '2026-11-10T14:30:00-03:00');
  recusa(
    remarcarConsulta(ctx, String(tarde), { ...paciente(), ...JANTAR }),
    'recusado',
    'o paciente só remarca até 24 h antes',
  );
  const limite = marcar('2026-11-10T14:00:00-03:00', '2026-11-10T14:30:00-03:00', 5, 2);
  assert.ok(remarcarConsulta(ctx, String(limite), { ...paciente(5), ...JANTAR }).ok);
});

test('a recepção remarca a 23 h 59 min do início', () => {
  const { ctx, marcar } = novoCenario();
  const id = marcar('2026-11-10T13:59:00-03:00', '2026-11-10T14:30:00-03:00');
  assert.ok(remarcarConsulta(ctx, String(id), { quem: 'recepcao', ...JANTAR }).ok);
});

test('recusa (409) remarcar consulta que já começou', () => {
  const { ctx, marcar } = novoCenario();
  const id = marcar('2026-11-09T13:00:00-03:00', '2026-11-09T15:00:00-03:00');
  recusa(remarcarConsulta(ctx, String(id), { quem: 'recepcao', ...JANTAR }), 'recusado', 'a consulta já começou');
});

test('recusa (409) novo horário no passado', () => {
  const { ctx, id } = novoCenario();
  recusa(
    remarcarConsulta(ctx, String(id), {
      quem: 'recepcao',
      ...novo('2026-11-09T09:00:00-03:00', '2026-11-09T09:30:00-03:00'),
    }),
    'recusado',
    'o novo horário já passou',
  );
});

test('recusa (409) consulta de outro paciente', () => {
  const { ctx, id } = novoCenario();
  recusa(
    remarcarConsulta(ctx, String(id), { ...paciente(4), ...JANTAR }),
    'recusado',
    'a consulta não pertence a esse paciente',
  );
});

test('recusa (409) consulta cancelada ou que foi falta', () => {
  const { ctx, marcar, id } = novoCenario();
  assert.ok(cancelarConsulta(ctx, String(id), { quem: 'recepcao' }).ok);
  recusa(remarcarConsulta(ctx, String(id), { quem: 'recepcao', ...JANTAR }), 'recusado', 'a consulta está cancelada');
  const faltou = marcar('2026-11-13T09:00:00-03:00', '2026-11-13T09:30:00-03:00', 5);
  ctx.repo.registrarFalta(faltou);
  recusa(
    remarcarConsulta(ctx, String(faltou), { quem: 'recepcao', ...JANTAR }),
    'recusado',
    'a consulta não está agendada',
  );
});

test('recusa (404) consulta que não existe', () => {
  const { ctx } = novoCenario();
  recusa(remarcarConsulta(ctx, '999', { quem: 'recepcao', ...JANTAR }), 'inexistente', 'Consulta não encontrada');
});

test('recusa (400) dados malformados', () => {
  const { ctx, id } = novoCenario();
  const i = String(id);
  recusa(remarcarConsulta(ctx, 'abc', { quem: 'recepcao', ...JANTAR }), 'malformado');
  recusa(remarcarConsulta(ctx, i, JANTAR), 'malformado');
  recusa(remarcarConsulta(ctx, i, { quem: 'gerente', ...JANTAR }), 'malformado');
  recusa(remarcarConsulta(ctx, i, { quem: 'paciente', ...JANTAR }), 'malformado');
  recusa(remarcarConsulta(ctx, i, { quem: 'recepcao' }), 'malformado');
  recusa(
    remarcarConsulta(ctx, i, { quem: 'recepcao', inicio: '2026-11-12T10:00:00', fim: '2026-11-12T10:30:00' }),
    'malformado',
  );
  recusa(
    remarcarConsulta(ctx, i, { quem: 'recepcao', ...novo('2026-11-12T10:30:00-03:00', '2026-11-12T10:00:00-03:00') }),
    'malformado',
  );
  recusa(remarcarConsulta(ctx, i, undefined), 'malformado');
});

test('paciente com 3 faltas ainda remarca uma consulta agendada', () => {
  const { ctx, marcar, id } = novoCenario();
  for (const dia of ['02', '03', '04']) {
    const f = ctx.repo.inserir({
      paciente_id: 3,
      profissional_id: 1,
      inicio_utc: `2026-11-${dia}T12:00:00.000Z`,
      fim_utc: `2026-11-${dia}T12:30:00.000Z`,
    });
    ctx.repo.registrarFalta(f.id);
  }
  assert.equal(agendarConsulta(ctx, { paciente_id: 3, profissional_id: 1, ...JANTAR }).ok, false);
  assert.ok(remarcarConsulta(ctx, String(id), { ...paciente(), ...JANTAR }).ok);
  void marcar;
});
