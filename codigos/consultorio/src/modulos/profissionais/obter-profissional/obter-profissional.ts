import { falha, lerId, type Resultado } from '../../../compartilhado/resultado.ts';
import type { Profissional, RepositorioProfissionais } from '../repositorio.ts';

export function obterProfissional(
  repo: RepositorioProfissionais,
  id: string,
): Resultado<{ profissional: Profissional }> {
  const numero = lerId(id);
  if (numero === undefined) return falha('malformado', 'O id do profissional deve ser um número inteiro');
  const profissional = repo.buscar(numero);
  if (!profissional) return falha('inexistente', 'Profissional não encontrado');
  return { ok: true, profissional };
}
