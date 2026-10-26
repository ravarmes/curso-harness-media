import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioAgenda } from '../repositorio.ts';
import { agendarConsulta, type Contexto } from '../agendar-consulta/agendar-consulta.ts';
import { listarHorariosLivres } from './listar-horarios-livres.ts';

type Faixa = { dia_semana: number; inicio_min: number; fim_min: number };
const h = (hora: number, min = 0) => hora * 60 + min;
const TERCA = 1; // 2026-11-10 é terça (0 = segunda)

// "Agora" = 2026-11-09T14:00:00-03:00. Profissionais 1 e 2; pacientes 1 a 9.
function novoCenario(
  expediente: Faixa[] = [
    { dia_semana: TERCA, inicio_min: h(8), fim_min: h(12) },
    { dia_semana: TERCA, inicio_min: h(14), fim_min: h(16) },
  ],
) {
  const ctx: Contexto = {
    repo: criarRepositorioAgenda(new DatabaseSync(':memory:')),
    pacienteExiste: (id) => id > 0 && id < 10,
    profissionalExiste: (id) => id === 1 || id === 2,
    expedienteDe: () => expediente,
    agora: () => Date.parse('2026-11-09T14:00:00-03:00'),
  };
  const marcar = (profissional_id: number, inicio: string, fim: string, paciente_id = 1) => {
    const r = agendarConsulta(ctx, { paciente_id, profissional_id, inicio, fim });
    assert.ok(r.ok);
    return r.consulta.id;
  };
  return { ctx, marcar };
}

// Devolve os inícios "HH:MM" da lista de horários livres.
function inicios(ctx: Contexto, data = '2026-11-10', id = '1'): string[] {
  const r = listarHorariosLivres(ctx, id, data);
  assert.ok(r.ok);
  return r.horarios.horarios.map((x) => x.inicio.slice(11, 16));
}

test('dia sem consultas lista 12 horários de 30 min dentro do expediente', () => {
  const { ctx } = novoCenario();
  const r = listarHorariosLivres(ctx, '1', '2026-11-10');
  assert.ok(r.ok);
  assert.equal(r.horarios.profissional_id, 1);
  assert.equal(r.horarios.data, '2026-11-10');
  assert.equal(r.horarios.duracao_min, 30);
  assert.deepEqual(r.horarios.horarios[0], { inicio: '2026-11-10T08:00:00-03:00', fim: '2026-11-10T08:30:00-03:00' });
  assert.deepEqual(inicios(ctx), [
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
  ]);
});

test('consulta das 09:00 às 10:00 tira 09:00 e 09:30, mas não os vizinhos', () => {
  const { ctx, marcar } = novoCenario();
  marcar(1, '2026-11-10T09:00:00-03:00', '2026-11-10T10:00:00-03:00');
  const lista = inicios(ctx);
  assert.ok(!lista.includes('09:00') && !lista.includes('09:30'));
  assert.ok(lista.includes('08:30') && lista.includes('10:00'));
});

test('qualquer sobreposição tira o horário: consulta das 09:15 às 09:45', () => {
  const { ctx, marcar } = novoCenario();
  marcar(1, '2026-11-10T09:15:00-03:00', '2026-11-10T09:45:00-03:00');
  const lista = inicios(ctx);
  assert.ok(!lista.includes('09:00') && !lista.includes('09:30'));
  assert.ok(lista.includes('08:30') && lista.includes('10:00'));
});

test('consulta cancelada libera o horário', () => {
  const { ctx, marcar } = novoCenario();
  const id = marcar(1, '2026-11-10T09:00:00-03:00', '2026-11-10T09:30:00-03:00');
  assert.ok(!inicios(ctx).includes('09:00'));
  ctx.repo.cancelar(id);
  assert.ok(inicios(ctx).includes('09:00'));
});

test('consulta de outro profissional não afeta a lista', () => {
  const { ctx, marcar } = novoCenario();
  marcar(2, '2026-11-10T09:00:00-03:00', '2026-11-10T10:00:00-03:00');
  assert.equal(inicios(ctx).length, 12);
});

test('faixas encostadas valem como uma só e atravessam o meio-dia', () => {
  const { ctx } = novoCenario([
    { dia_semana: TERCA, inicio_min: h(8), fim_min: h(12) },
    { dia_semana: TERCA, inicio_min: h(12), fim_min: h(18) },
  ]);
  const lista = inicios(ctx);
  assert.equal(lista.length, 20);
  assert.ok(lista.includes('11:30') && lista.includes('12:00'));
});

test('faixa de 14:00 às 14:45 oferece só 14:00', () => {
  const { ctx } = novoCenario([{ dia_semana: TERCA, inicio_min: h(14), fim_min: h(14, 45) }]);
  assert.deepEqual(inicios(ctx), ['14:00']);
});

test('dia sem expediente devolve lista vazia', () => {
  const { ctx } = novoCenario();
  assert.deepEqual(inicios(ctx, '2026-11-08'), []);
  assert.deepEqual(inicios(ctx, '2026-11-11'), []);
});

test('hoje só lista horários que começam depois de agora', () => {
  const { ctx } = novoCenario([{ dia_semana: 0, inicio_min: h(8), fim_min: h(18) }]); // 2026-11-09 é segunda
  const lista = inicios(ctx, '2026-11-09');
  assert.equal(lista[0], '14:30'); // 14:00 começa exatamente agora: não é oferecido
  assert.equal(lista.at(-1), '17:30');
});

test('dia no passado devolve lista vazia', () => {
  const { ctx } = novoCenario([{ dia_semana: 6, inicio_min: h(8), fim_min: h(18) }]); // 2026-11-08 é domingo
  assert.deepEqual(inicios(ctx, '2026-11-08'), []);
});

test('profissional que não existe é inexistente', () => {
  const { ctx } = novoCenario();
  const r = listarHorariosLivres(ctx, '999', '2026-11-10');
  assert.ok(!r.ok && r.erro.tipo === 'inexistente' && r.erro.mensagem === 'Profissional não encontrado');
});

test('id ou data malformados são malformado, com a mensagem do critério', () => {
  const { ctx } = novoCenario();
  const idRuim = listarHorariosLivres(ctx, 'abc', '2026-11-10');
  assert.ok(!idRuim.ok && idRuim.erro.tipo === 'malformado');
  assert.equal(idRuim.erro.mensagem, 'O id do profissional deve ser um número inteiro');
  for (const data of ['10/11/2026', '2026-02-30']) {
    const r = listarHorariosLivres(ctx, '1', data);
    assert.ok(!r.ok && r.erro.tipo === 'malformado' && r.erro.mensagem === 'A data deve estar no formato AAAA-MM-DD');
  }
});

test('todo horário devolvido é aceito pelo agendamento', () => {
  const { ctx, marcar } = novoCenario();
  marcar(1, '2026-11-10T09:00:00-03:00', '2026-11-10T10:00:00-03:00');
  const r = listarHorariosLivres(ctx, '1', '2026-11-10');
  assert.ok(r.ok);
  for (const { inicio, fim } of r.horarios.horarios) {
    assert.ok(agendarConsulta(ctx, { paciente_id: 2, profissional_id: 1, inicio, fim }).ok, inicio);
  }
});
