import type { Rota } from '../../../compartilhado/http.ts';
import type { listarBairros } from './listar-bairros.ts';

export function rotaListarBairros(listar: () => ReturnType<typeof listarBairros>): Rota {
  return { metodo: 'GET', caminho: '/bairros', manipulador: () => ({ status: 200, corpo: listar() }) };
}
