import type { Rota } from '../../../compartilhado/http.ts';
import type { listarItens } from './listar-itens.ts';

export function rotaListarItens(listar: () => ReturnType<typeof listarItens>): Rota {
  return { metodo: 'GET', caminho: '/cardapio', manipulador: () => ({ status: 200, corpo: listar() }) };
}
