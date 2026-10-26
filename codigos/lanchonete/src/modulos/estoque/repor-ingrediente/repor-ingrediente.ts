import type { Ingrediente, RepositorioDoEstoque } from '../repositorio.ts';

export type ResultadoReporIngrediente =
  { ok: true; ingrediente: Ingrediente } | { ok: false; tipo: 'invalido' | 'inexistente'; erro: string };

// Valida o corpo antes de procurar o ingrediente. O id chega como texto da
// URL; o que não for inteiro positivo não existe.
export function reporIngrediente(
  repo: Pick<RepositorioDoEstoque, 'buscarPorId' | 'somarQuantidade'>,
  id: string,
  quantidade: unknown,
): ResultadoReporIngrediente {
  if (typeof quantidade !== 'number' || !Number.isInteger(quantidade) || quantidade <= 0) {
    return { ok: false, tipo: 'invalido', erro: 'quantidade deve ser um inteiro positivo' };
  }
  const existente = /^[1-9]\d*$/.test(id) ? repo.buscarPorId(Number(id)) : undefined;
  if (!existente) return { ok: false, tipo: 'inexistente', erro: 'ingrediente não encontrado' };
  repo.somarQuantidade(existente.id, quantidade);
  return { ok: true, ingrediente: { ...existente, quantidade: existente.quantidade + quantidade } };
}
