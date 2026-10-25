import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioAgenda } from '../repositorio.ts';
import { agendarConsulta, type Contexto } from './agendar-consulta.ts';

// 2026-11-10 é terça (dia_semana 1). Profissional 1: terça 08-12 e 12-18 (encostadas), quarta 00-24.
function novoCenario() {
  const ctx: Contexto = {
    repo: criarRepositorioAgenda(new DatabaseSync(':memory:')),
    agora: () => Date.now(),
    pacienteExiste: (id) => id === 1 || id === 2,
    profissionalExiste: (id) => id === 1 || id === 2,
    expedienteDe: (id) =>
      id === 1
        ? [
            { dia_semana: 1, inicio_min: 8 * 60, fim_min: 12 * 60 },
            { dia_semana: 1, inicio_min: 12 * 60, fim_min: 18 * 60 },
            { dia_semana: 2, inicio_min: 0, fim_min: 24 * 60 },
          ]
        : [{ dia_semana: 1, inicio_min: 8 * 60, fim_min: 18 * 60 }],
  };
  return ctx;
}
const pedido = (inicio: unknown, fim: unknown, paciente_id: unknown = 1, profissional_id: unknown = 1) => ({
  paciente_id,
  profissional_id,
  inicio,
  fim,
});
const recusa = (r: ReturnType<typeof agendarConsulta>, tipo: string) => {
  assert.ok(!r.ok && r.erro.tipo === tipo, JSON.stringify(r));
};

test('agenda a consulta e devolve os horários no fuso de Brasília', () => {
  const ctx = novoCenario();
  const r = agendarConsulta(ctx, pedido('2026-11-10T17:00:00Z', '2026-11-10T18:00:00Z'));
  assert.deepEqual(r, {
    ok: true,
    consulta: {
      id: 1,
      paciente_id: 1,
      profissional_id: 1,
      inicio: '2026-11-10T14:00:00-03:00',
      fim: '2026-11-10T15:00:00-03:00',
    },
  });
});

test('consultas encostadas não se sobrepõem', () => {
  const ctx = novoCenario();
  assert.ok(agendarConsulta(ctx, pedido('2026-11-10T09:00:00-03:00', '2026-11-10T10:00:00-03:00')).ok);
  assert.ok(agendarConsulta(ctx, pedido('2026-11-10T10:00:00-03:00', '2026-11-10T11:00:00-03:00')).ok);
  assert.ok(agendarConsulta(ctx, pedido('2026-11-10T08:00:00-03:00', '2026-11-10T09:00:00-03:00')).ok);
});

test('recusa (409) sobreposição do profissional, parcial, contida ou contendo', () => {
  const ctx = novoCenario();
  agendarConsulta(ctx, pedido('2026-11-10T09:00:00-03:00', '2026-11-10T10:00:00-03:00'));
  for (const [i, f] of [
    ['08:30', '09:30'],
    ['09:30', '10:30'],
    ['09:15', '09:45'],
    ['08:00', '11:00'],
    ['09:00', '10:00'],
  ]) {
    // outro paciente: o conflito é só do profissional
    recusa(agendarConsulta(ctx, pedido(`2026-11-10T${i}:00-03:00`, `2026-11-10T${f}:00-03:00`, 2)), 'recusado');
  }
});

test('recusa (409) sobreposição do paciente com outro profissional', () => {
  const ctx = novoCenario();
  agendarConsulta(ctx, pedido('2026-11-10T09:00:00-03:00', '2026-11-10T10:00:00-03:00', 1, 1));
  recusa(agendarConsulta(ctx, pedido('2026-11-10T09:30:00-03:00', '2026-11-10T10:30:00-03:00', 1, 2)), 'recusado');
  assert.ok(agendarConsulta(ctx, pedido('2026-11-10T09:30:00-03:00', '2026-11-10T10:30:00-03:00', 2, 2)).ok);
});

test('o conflito vale pelo instante, não pelo offset escrito', () => {
  const ctx = novoCenario();
  agendarConsulta(ctx, pedido('2026-11-10T09:00:00-03:00', '2026-11-10T10:00:00-03:00'));
  recusa(agendarConsulta(ctx, pedido('2026-11-10T12:30:00Z', '2026-11-10T13:30:00Z', 2)), 'recusado');
});

test('recusa (409) consulta fora do expediente', () => {
  const ctx = novoCenario();
  const fora: [string, string][] = [
    ['2026-11-10T07:30:00-03:00', '2026-11-10T08:30:00-03:00'], // começa antes
    ['2026-11-10T17:30:00-03:00', '2026-11-10T18:30:00-03:00'], // termina depois
    ['2026-11-09T09:00:00-03:00', '2026-11-09T10:00:00-03:00'], // segunda: sem expediente
    ['2026-11-12T09:00:00-03:00', '2026-11-12T10:00:00-03:00'], // quinta: sem expediente
  ];
  for (const [i, f] of fora) recusa(agendarConsulta(ctx, pedido(i, f)), 'recusado');
});

test('expediente: encostadas valem como contínuo, e o dia pode ir até 24:00', () => {
  const ctx = novoCenario();
  assert.ok(agendarConsulta(ctx, pedido('2026-11-10T11:00:00-03:00', '2026-11-10T13:00:00-03:00')).ok);
  assert.ok(agendarConsulta(ctx, pedido('2026-11-11T23:00:00-03:00', '2026-11-12T00:00:00-03:00')).ok);
});

test('consulta que atravessa a meia-noite sem expediente no dia seguinte é recusada', () => {
  const ctx = novoCenario();
  recusa(agendarConsulta(ctx, pedido('2026-11-11T23:30:00-03:00', '2026-11-12T00:30:00-03:00')), 'recusado');
});

test('o dia é o de Brasília: 22h de terça em Brasília já é quarta em UTC', () => {
  const ctx = novoCenario();
  // 2026-11-11T01:00Z = 10/11 22:00 em Brasília (terça, fora do expediente 08-18)
  recusa(agendarConsulta(ctx, pedido('2026-11-11T01:00:00Z', '2026-11-11T02:00:00Z')), 'recusado');
});

test('recusa (400) dados malformados ou sem offset', () => {
  const ctx = novoCenario();
  const ruins: unknown[] = [
    undefined,
    null,
    {},
    pedido('2026-11-10T14:00:00', '2026-11-10T15:00:00-03:00'), // sem offset
    pedido('2026-11-10T14:00:00-03:00', '2026-11-10T15:00:00'),
    pedido('2026-11-10', '2026-11-10T15:00:00-03:00'),
    pedido('2026-02-30T10:00:00-03:00', '2026-02-30T11:00:00-03:00'),
    pedido('2026-11-10T25:00:00-03:00', '2026-11-10T26:00:00-03:00'),
    pedido(undefined, '2026-11-10T15:00:00-03:00'),
    pedido('2026-11-10T15:00:00-03:00', '2026-11-10T14:00:00-03:00'), // fim antes do início
    pedido('2026-11-10T14:00:00-03:00', '2026-11-10T14:00:00-03:00'), // duração zero
    pedido('2026-11-10T14:00:00-03:00', '2026-11-10T15:00:00-03:00', '1'),
    pedido('2026-11-10T14:00:00-03:00', '2026-11-10T15:00:00-03:00', 1.5),
    { paciente_id: 1, inicio: '2026-11-10T14:00:00-03:00', fim: '2026-11-10T15:00:00-03:00' }, // sem profissional_id
    pedido('2026-11-10T14:00:00-03:00', '2026-11-10T15:00:00-03:00', 0),
  ];
  for (const dados of ruins) recusa(agendarConsulta(ctx, dados), 'malformado');
});

test('recusa (404) paciente ou profissional que não existe', () => {
  const ctx = novoCenario();
  recusa(agendarConsulta(ctx, pedido('2026-11-10T09:00:00-03:00', '2026-11-10T10:00:00-03:00', 99)), 'inexistente');
  recusa(agendarConsulta(ctx, pedido('2026-11-10T09:00:00-03:00', '2026-11-10T10:00:00-03:00', 1, 99)), 'inexistente');
});

test('consulta recusada não fica gravada', () => {
  const ctx = novoCenario();
  recusa(agendarConsulta(ctx, pedido('2026-11-10T20:00:00-03:00', '2026-11-10T21:00:00-03:00')), 'recusado');
  assert.deepEqual(ctx.repo.doProfissionalNoPeriodo(1, '2026-11-01T00:00:00.000Z', '2026-12-01T00:00:00.000Z'), []);
});

test('consulta cancelada libera o horário do profissional e do paciente', () => {
  const ctx = novoCenario();
  const primeira = agendarConsulta(ctx, pedido('2026-11-10T09:00:00-03:00', '2026-11-10T10:00:00-03:00'));
  assert.ok(primeira.ok);
  ctx.repo.cancelar(primeira.consulta.id);
  assert.ok(agendarConsulta(ctx, pedido('2026-11-10T09:00:00-03:00', '2026-11-10T10:00:00-03:00', 2)).ok); // mesmo profissional
  assert.ok(agendarConsulta(ctx, pedido('2026-11-10T09:00:00-03:00', '2026-11-10T10:00:00-03:00', 1, 2)).ok); // mesmo paciente
});

// Bloqueio por faltas: "agora" é segunda, 09/11 14:00 em Brasília; a janela de 90 dias começa em 11/08 00:00.
const AGORA = Date.parse('2026-11-09T14:00:00-03:00');

function cenarioComFaltas() {
  const ctx = { ...novoCenario(), agora: () => AGORA };
  // Registra uma falta de 1 h do paciente, começando em `inicio`.
  const faltar = (paciente: number, inicio: string) => {
    const { id } = ctx.repo.inserir({
      paciente_id: paciente,
      profissional_id: 1,
      inicio_utc: new Date(inicio).toISOString(),
      fim_utc: new Date(Date.parse(inicio) + 60 * 60_000).toISOString(),
    });
    ctx.repo.registrarFalta(id);
  };
  const faltas = (paciente: number, inicios: string[]) => inicios.forEach((i) => faltar(paciente, i));
  return { ctx, faltar, faltas };
}
const AMANHA = pedido('2026-11-10T14:00:00-03:00', '2026-11-10T15:00:00-03:00');
const TRES = ['2026-10-01T09:00:00-03:00', '2026-10-15T09:00:00-03:00', '2026-11-05T09:00:00-03:00'];

test('agenda o paciente com 2 faltas nos últimos 90 dias', () => {
  const { ctx, faltas } = cenarioComFaltas();
  faltas(1, TRES.slice(0, 2));
  assert.ok(agendarConsulta(ctx, AMANHA).ok);
});

test('recusa (409) o paciente com faltas demais nos últimos 90 dias, sem gravar', () => {
  const { ctx, faltas } = cenarioComFaltas();
  faltas(1, [...TRES, '2026-10-20T09:00:00-03:00', '2026-10-27T09:00:00-03:00']);
  const r = agendarConsulta(ctx, AMANHA);
  recusa(r, 'recusado');
  assert.deepEqual(ctx.repo.noPeriodo('2026-11-10T00:00:00.000Z', '2026-11-11T00:00:00.000Z'), []);
});

test('cancelamentos não contam como falta', () => {
  const { ctx, faltas } = cenarioComFaltas();
  faltas(1, TRES.slice(0, 2));
  for (const h of ['09', '10', '11', '12', '13']) {
    const { id } = ctx.repo.inserir({
      paciente_id: 1,
      profissional_id: 1,
      inicio_utc: `2026-11-05T${h}:00:00.000Z`,
      fim_utc: `2026-11-05T${h}:30:00.000Z`,
    });
    ctx.repo.cancelar(id);
  }
  assert.ok(agendarConsulta(ctx, AMANHA).ok);
});

test('as faltas de outro paciente não contam', () => {
  const { ctx, faltas } = cenarioComFaltas();
  faltas(1, TRES);
  assert.ok(agendarConsulta(ctx, pedido('2026-11-10T14:00:00-03:00', '2026-11-10T15:00:00-03:00', 2)).ok);
});

test('paciente bloqueado com dado malformado ou inexistente recebe 400 ou 404, não 409', () => {
  const { ctx, faltas } = cenarioComFaltas();
  faltas(1, TRES);
  recusa(agendarConsulta(ctx, pedido('amanhã', '2026-11-10T15:00:00-03:00')), 'malformado');
  recusa(agendarConsulta(ctx, pedido('2026-11-10T14:00:00-03:00', '2026-11-10T15:00:00-03:00', 1, 99)), 'inexistente');
});
