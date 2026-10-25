import type { Profissional, RepositorioProfissionais } from '../repositorio.ts';

// Listar nunca recusa o pedido, por isso o resultado é sempre ok.
export function listarProfissionais(repo: RepositorioProfissionais): { ok: true; profissionais: Profissional[] } {
  return { ok: true, profissionais: repo.listar() };
}
