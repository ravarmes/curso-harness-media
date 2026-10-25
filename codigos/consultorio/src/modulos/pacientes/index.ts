import type { DatabaseSync } from 'node:sqlite';
import { criarRepositorioPacientes } from './repositorio.ts';
import { rotaCadastrarPaciente } from './cadastrar-paciente/rota.ts';
import { rotaListarPacientes } from './listar-pacientes/rota.ts';
import { rotaObterPaciente } from './obter-paciente/rota.ts';

export function pacientes(banco: DatabaseSync) {
  const repo = criarRepositorioPacientes(banco);
  return {
    rotas: [rotaCadastrarPaciente(repo), rotaListarPacientes(repo), rotaObterPaciente(repo)],
    // Para os outros módulos (ex.: agenda) perguntarem se o paciente existe.
    existe: (id: number) => repo.buscar(id) !== undefined,
  };
}
