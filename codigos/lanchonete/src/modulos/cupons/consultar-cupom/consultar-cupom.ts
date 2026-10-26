import type { Cupom, RepositorioDosCupons } from '../repositorio.ts';

export type ResultadoConsultarCupom = { ok: true; cupom: Cupom } | { ok: false; erro: string };

// O código chega como texto da URL; a busca ignora maiúsculas e espaços ao redor.
export function consultarCupom(
  repo: Pick<RepositorioDosCupons, 'buscarPorCodigo'>,
  codigo: string,
): ResultadoConsultarCupom {
  const cupom = repo.buscarPorCodigo(codigo.trim().toUpperCase());
  return cupom ? { ok: true, cupom } : { ok: false, erro: 'cupom não encontrado' };
}
