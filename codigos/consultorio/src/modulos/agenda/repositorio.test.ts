import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioAgenda } from './repositorio.ts';

const A = '2026-11-11T12:00:00.000Z';
const B = '2026-11-11T12:30:00.000Z';
const C = '2026-11-12T13:00:00.000Z';
const D = '2026-11-12T13:30:00.000Z';

test('remarcar muda o horário da mesma consulta e libera o antigo', () => {
  const repo = criarRepositorioAgenda(new DatabaseSync(':memory:'));
  const { id } = repo.inserir({ paciente_id: 3, profissional_id: 1, inicio_utc: A, fim_utc: B });
  repo.remarcar(id, C, D);
  const consulta = repo.porId(id);
  assert.equal(consulta?.inicio_utc, C);
  assert.equal(consulta?.fim_utc, D);
  assert.equal(consulta?.status, 'agendada');
  assert.equal(repo.profissionalOcupado(1, A, B), false);
  assert.equal(repo.pacienteOcupado(3, A, B), false);
  assert.equal(repo.profissionalOcupado(1, C, D), true);
});

test('a consulta ignorada não conta como ocupando o horário', () => {
  const repo = criarRepositorioAgenda(new DatabaseSync(':memory:'));
  const { id } = repo.inserir({ paciente_id: 3, profissional_id: 1, inicio_utc: A, fim_utc: B });
  assert.equal(repo.profissionalOcupado(1, A, B), true);
  assert.equal(repo.profissionalOcupado(1, A, B, id), false);
  assert.equal(repo.pacienteOcupado(3, A, B, id), false);
  // Outra consulta no mesmo horário continua contando.
  repo.inserir({ paciente_id: 4, profissional_id: 1, inicio_utc: A, fim_utc: B });
  assert.equal(repo.profissionalOcupado(1, A, B, id), true);
});
