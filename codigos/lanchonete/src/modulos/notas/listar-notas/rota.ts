import type { Rota } from '../../../compartilhado/http.ts';
import type { listarNotas } from './listar-notas.ts';

export function rotaListarNotas(listar: () => ReturnType<typeof listarNotas>): Rota {
  return { metodo: 'GET', caminho: '/notas', manipulador: () => ({ status: 200, corpo: listar() }) };
}
