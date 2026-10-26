import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioAgenda } from '../repositorio.ts';
import { relatorioDeOcupacao, type ContextoRelatorio } from './relatorio-de-ocupacao.ts';

type Faixa = { dia_semana: number; inicio_min: number; fim_min: number };
const h = (hora: number, min = 0) => hora * 60 + min;
const SEGUNDA = 0; // 2026-11-09
const TERCA = 1; // 2026-11-10

const manha: Faixa[] = [
  { dia_semana: SEGUNDA, inicio_min: h(8), fim_min: h(12) },
  { dia_semana: TERCA, inicio_min: h(8), fim_min: h(12) },
];

const doisProfissionais = [
  { id: 1, nome: 'Dra. Ana' },
  { id: 2, nome: 'Dr. Bruno' },
];

// Profissionais 1 (Dra. Ana, com `expedienteA`) e 2 (Dr. Bruno, sem expediente).
function novoCenario(expedienteA: Faixa[] = manha, profissionais = doisProfissionais) {
  const repo = criarRepositorioAgenda(new DatabaseSync(':memory:'));
  const ctx: ContextoRelatorio = {
    repo,
    pacienteExiste: () => true,
    profissionalExiste: (id) => profissionais.some((p) => p.id === id),
    expedienteDe: (id) => (id === 1 ? expedienteA : []),
    agora: () => Date.parse('2026-11-09T14:00:00-03:00'),
    listarProfissionais: () => profissionais,
  };
  // Horários em ISO 8601 com offset de Brasília.
  const marcar = (profissional_id: number, inicio: string, fim: string) =>
    repo.inserir({
      paciente_id: 1,
      profissional_id,
      inicio_utc: new Date(inicio).toISOString(),
      fim_utc: new Date(fim).toISOString(),
    });
  return { ctx, repo, marcar };
}

function ana(ctx: ContextoRelatorio, de: string, ate: string) {
  const r = relatorioDeOcupacao(ctx, de, ate);
  assert.ok(r.ok);
  const item = r.relatorio.profissionais.find((p) => p.profissional_id === 1);
  assert.ok(item);
  return item;
}

test('sem consultas: expediente somado e nada ocupado', () => {
  const { ctx } = novoCenario();
  const r = relatorioDeOcupacao(ctx, '2026-11-09', '2026-11-10');
  assert.ok(r.ok);
  assert.equal(r.relatorio.de, '2026-11-09');
  assert.equal(r.relatorio.ate, '2026-11-10');
  assert.deepEqual(r.relatorio.profissionais[0], {
    profissional_id: 1,
    nome: 'Dra. Ana',
    horas_expediente: 8,
    horas_ocupadas: 0,
    percentual_ocupacao: 0,
  });
});

test('duas consultas de 30 min dão 1 h ocupada e 12,5%', () => {
  const { ctx, marcar } = novoCenario();
  marcar(1, '2026-11-09T09:00:00-03:00', '2026-11-09T09:30:00-03:00');
  marcar(1, '2026-11-09T10:00:00-03:00', '2026-11-09T10:30:00-03:00');
  const a = ana(ctx, '2026-11-09', '2026-11-10');
  assert.equal(a.horas_ocupadas, 1);
  assert.equal(a.percentual_ocupacao, 12.5);
});

test('período de um dia só soma o expediente daquele dia', () => {
  const { ctx } = novoCenario();
  assert.equal(ana(ctx, '2026-11-10', '2026-11-10').horas_expediente, 4);
});

test('dia sem expediente (domingo) soma zero', () => {
  const { ctx } = novoCenario();
  assert.equal(ana(ctx, '2026-11-08', '2026-11-10').horas_expediente, 8);
});

test('faixas encostadas contam uma vez só', () => {
  const { ctx } = novoCenario([
    { dia_semana: TERCA, inicio_min: h(8), fim_min: h(12) },
    { dia_semana: TERCA, inicio_min: h(12), fim_min: h(18) },
  ]);
  assert.equal(ana(ctx, '2026-11-10', '2026-11-10').horas_expediente, 10);
});

test('faixas sobrepostas não contam em dobro', () => {
  const { ctx } = novoCenario([
    { dia_semana: TERCA, inicio_min: h(8), fim_min: h(12) },
    { dia_semana: TERCA, inicio_min: h(10), fim_min: h(14) },
  ]);
  assert.equal(ana(ctx, '2026-11-10', '2026-11-10').horas_expediente, 6);
});

test('consulta cancelada não conta como ocupada', () => {
  const { ctx, repo, marcar } = novoCenario();
  repo.cancelar(marcar(1, '2026-11-10T09:00:00-03:00', '2026-11-10T09:30:00-03:00').id);
  assert.equal(ana(ctx, '2026-11-10', '2026-11-10').horas_ocupadas, 0);
});

test('consulta com falta conta como ocupada', () => {
  const { ctx, repo, marcar } = novoCenario();
  repo.registrarFalta(marcar(1, '2026-11-10T09:00:00-03:00', '2026-11-10T09:30:00-03:00').id);
  assert.equal(ana(ctx, '2026-11-10', '2026-11-10').horas_ocupadas, 0.5);
});

test('o período vai do início do primeiro dia ao fim do último dia de Brasília', () => {
  const { ctx, marcar } = novoCenario();
  marcar(1, '2026-11-10T23:30:00-03:00', '2026-11-11T00:00:00-03:00'); // dentro
  marcar(1, '2026-11-11T00:00:00-03:00', '2026-11-11T00:30:00-03:00'); // dia seguinte: fora
  marcar(1, '2026-11-08T23:30:00-03:00', '2026-11-09T00:00:00-03:00'); // dia anterior: fora
  marcar(1, '2026-11-09T00:00:00-03:00', '2026-11-09T00:30:00-03:00'); // primeiro instante: dentro
  assert.equal(ana(ctx, '2026-11-09', '2026-11-10').horas_ocupadas, 1);
});

test('consulta de outro profissional não afeta o profissional', () => {
  const { ctx, marcar } = novoCenario();
  marcar(2, '2026-11-10T09:00:00-03:00', '2026-11-10T10:00:00-03:00');
  assert.equal(ana(ctx, '2026-11-10', '2026-11-10').horas_ocupadas, 0);
});

test('profissional sem expediente tem percentual 0, sem dividir por zero', () => {
  const { ctx, marcar } = novoCenario();
  marcar(2, '2026-11-10T09:00:00-03:00', '2026-11-10T10:00:00-03:00');
  const r = relatorioDeOcupacao(ctx, '2026-11-10', '2026-11-10');
  assert.ok(r.ok);
  assert.deepEqual(r.relatorio.profissionais[1], {
    profissional_id: 2,
    nome: 'Dr. Bruno',
    horas_expediente: 0,
    horas_ocupadas: 1,
    percentual_ocupacao: 0,
  });
});

test('sem profissionais cadastrados, lista vazia', () => {
  const { ctx } = novoCenario(manha, []);
  const r = relatorioDeOcupacao(ctx, '2026-11-10', '2026-11-10');
  assert.ok(r.ok);
  assert.deepEqual(r.relatorio.profissionais, []);
});

test('datas em formato errado dão 400', () => {
  const { ctx } = novoCenario();
  for (const [de, ate] of [
    ['10/11/2026', '2026-11-10'],
    ['2026-11-10', '2026-02-30'],
    ['2026-11-10', 'x'],
  ]) {
    assert.deepEqual(relatorioDeOcupacao(ctx, de, ate), {
      ok: false,
      erro: { tipo: 'malformado', mensagem: 'As datas devem estar no formato AAAA-MM-DD' },
    });
  }
});

test('data final anterior à inicial é recusada', () => {
  const { ctx } = novoCenario();
  assert.deepEqual(relatorioDeOcupacao(ctx, '2026-11-10', '2026-11-09'), {
    ok: false,
    erro: { tipo: 'recusado', mensagem: 'A data final não pode ser anterior à inicial' },
  });
});

test('período de 92 dias é aceito e de 93 dias é recusado', () => {
  const { ctx } = novoCenario();
  assert.ok(relatorioDeOcupacao(ctx, '2026-11-01', '2027-01-31').ok); // 92 dias
  assert.deepEqual(relatorioDeOcupacao(ctx, '2026-11-01', '2027-02-01'), {
    ok: false,
    erro: { tipo: 'recusado', mensagem: 'O período deve ter no máximo 92 dias' },
  });
});
