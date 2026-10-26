import type { Bairro, RepositorioDosBairros } from '../repositorio.ts';

export type ResultadoConsultarBairro = { ok: true; bairro: Bairro } | { ok: false; erro: string };

// O id chega como texto da URL; o que não for inteiro positivo não existe.
export function consultarBairro(
  repo: Pick<RepositorioDosBairros, 'buscarPorId'>,
  id: string,
): ResultadoConsultarBairro {
  const bairro = /^[1-9]\d*$/.test(id) ? repo.buscarPorId(Number(id)) : undefined;
  return bairro ? { ok: true, bairro } : { ok: false, erro: 'bairro não encontrado' };
}
