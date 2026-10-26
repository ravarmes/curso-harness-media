import type { Bairro, RepositorioDosBairros } from '../repositorio.ts';

export function listarBairros(repo: Pick<RepositorioDosBairros, 'listar'>): Bairro[] {
  return repo.listar();
}
