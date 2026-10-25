import type { Paciente, RepositorioPacientes } from '../repositorio.ts';

// Listar nunca recusa o pedido, por isso o resultado é sempre ok.
export function listarPacientes(repo: RepositorioPacientes): { ok: true; pacientes: Paciente[] } {
  return { ok: true, pacientes: repo.listar() };
}
