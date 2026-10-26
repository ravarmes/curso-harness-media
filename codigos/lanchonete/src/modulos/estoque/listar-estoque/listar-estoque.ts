import type { Ingrediente, RepositorioDoEstoque } from '../repositorio.ts';

export function listarEstoque(repo: Pick<RepositorioDoEstoque, 'listar'>): Ingrediente[] {
  return repo.listar();
}
