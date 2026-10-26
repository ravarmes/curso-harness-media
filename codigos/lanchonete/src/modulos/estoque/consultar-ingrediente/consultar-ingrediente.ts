import type { Ingrediente, RepositorioDoEstoque } from '../repositorio.ts';

export type ResultadoConsultarIngrediente = { ok: true; ingrediente: Ingrediente } | { ok: false; erro: string };

// O id chega como texto da URL; o que não for inteiro positivo não existe.
export function consultarIngrediente(
  repo: Pick<RepositorioDoEstoque, 'buscarPorId'>,
  id: string,
): ResultadoConsultarIngrediente {
  const ingrediente = /^[1-9]\d*$/.test(id) ? repo.buscarPorId(Number(id)) : undefined;
  return ingrediente ? { ok: true, ingrediente } : { ok: false, erro: 'ingrediente não encontrado' };
}
