import type { ItemDoCardapio, RepositorioDoCardapio } from '../repositorio.ts';

export type ResultadoConsultarItem = { ok: true; item: ItemDoCardapio } | { ok: false; erro: string };

// O id chega como texto da URL; o que não for inteiro positivo não existe.
export function consultarItem(repo: Pick<RepositorioDoCardapio, 'buscarPorId'>, id: string): ResultadoConsultarItem {
  const item = /^[1-9]\d*$/.test(id) ? repo.buscarPorId(Number(id)) : undefined;
  return item ? { ok: true, item } : { ok: false, erro: 'item não encontrado' };
}
