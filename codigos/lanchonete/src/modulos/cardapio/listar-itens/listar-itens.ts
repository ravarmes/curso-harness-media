import type { ItemDoCardapio, RepositorioDoCardapio } from '../repositorio.ts';

export function listarItens(repo: Pick<RepositorioDoCardapio, 'listar'>): ItemDoCardapio[] {
  return repo.listar();
}
