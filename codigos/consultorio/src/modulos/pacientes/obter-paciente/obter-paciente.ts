import { falha, lerId, type Resultado } from '../../../compartilhado/resultado.ts';
import type { Paciente, RepositorioPacientes } from '../repositorio.ts';

export function obterPaciente(repo: RepositorioPacientes, id: string): Resultado<{ paciente: Paciente }> {
  const numero = lerId(id);
  if (numero === undefined) return falha('malformado', 'O id do paciente deve ser um número inteiro');
  const paciente = repo.buscar(numero);
  if (!paciente) return falha('inexistente', 'Paciente não encontrado');
  return { ok: true, paciente };
}
