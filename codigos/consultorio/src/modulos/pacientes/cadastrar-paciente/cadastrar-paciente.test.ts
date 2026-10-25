import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioPacientes } from '../repositorio.ts';
import { cadastrarPaciente } from './cadastrar-paciente.ts';

const novoRepo = () => criarRepositorioPacientes(new DatabaseSync(':memory:'));

test('cadastra e normaliza o telefone', () => {
  const r = cadastrarPaciente(novoRepo(), { nome: ' Ana ', telefone: '+55 (11) 99999-8888' });
  assert.deepEqual(r, { ok: true, paciente: { id: 1, nome: 'Ana', telefone: '+5511999998888', email: null } });
});

test('guarda o e-mail quando vem', () => {
  const r = cadastrarPaciente(novoRepo(), { nome: 'Ana', telefone: '+5511999998888', email: 'ana@exemplo.com' });
  assert.ok(r.ok && r.paciente.email === 'ana@exemplo.com');
});

test('recusa dado malformado ou faltando, sem gravar', () => {
  const repo = novoRepo();
  const ruins: unknown[] = [
    undefined,
    'texto',
    {},
    { telefone: '+5511999998888' },
    { nome: '   ', telefone: '+5511999998888' },
    { nome: 'Ana' },
    { nome: 'Ana', telefone: '123' },
    { nome: 'Ana', telefone: '11999998888' },
    { nome: 'Ana', telefone: 5511999998888 },
    { nome: 'Ana', telefone: '+5511999998888', email: 42 },
  ];
  for (const dados of ruins) {
    const r = cadastrarPaciente(repo, dados);
    assert.ok(!r.ok && r.erro.tipo === 'malformado', JSON.stringify(dados));
  }
  assert.deepEqual(repo.listar(), []);
});
