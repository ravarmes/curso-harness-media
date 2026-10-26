import type { Rota } from '../../../compartilhado/http.ts';
import type { listarEstoque } from './listar-estoque.ts';

export function rotaListarEstoque(listar: () => ReturnType<typeof listarEstoque>): Rota {
  return { metodo: 'GET', caminho: '/estoque', manipulador: () => ({ status: 200, corpo: listar() }) };
}
