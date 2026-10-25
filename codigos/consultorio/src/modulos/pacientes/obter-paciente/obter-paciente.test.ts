import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioPacientes } from '../repositorio.ts';
import { obterPaciente } from './obter-paciente.ts';

const novoRepo = () => criarRepositorioPacientes(new DatabaseSync(':memory:'));

test('devolve o paciente cadastrado', () => {
  const repo = novoRepo();
  const ana = repo.inserir({ nome: 'Ana', telefone: '+5511999998888', email: null });
  assert.deepEqual(obterPaciente(repo, String(ana.id)), { ok: true, paciente: ana });
});

test('paciente que não existe é inexistente', () => {
  const r = obterPaciente(novoRepo(), '999');
  assert.ok(!r.ok && r.erro.tipo === 'inexistente');
});

test('id que não é número é malformado', () => {
  for (const id of ['abc', '1.5', '-1', '']) {
    const r = obterPaciente(novoRepo(), id);
    assert.ok(!r.ok && r.erro.tipo === 'malformado', id);
  }
});
