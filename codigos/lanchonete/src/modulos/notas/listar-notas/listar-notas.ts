import type { Nota, RepositorioDeNotas } from '../repositorio.ts';

export function listarNotas(repo: Pick<RepositorioDeNotas, 'listar'>): Nota[] {
  return repo.listar();
}
