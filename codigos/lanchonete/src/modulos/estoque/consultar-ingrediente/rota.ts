import type { Rota } from '../../../compartilhado/http.ts';
import type { ResultadoConsultarIngrediente } from './consultar-ingrediente.ts';

export function rotaConsultarIngrediente(consultar: (id: string) => ResultadoConsultarIngrediente): Rota {
  return {
    metodo: 'GET',
    caminho: '/estoque/:id',
    manipulador: (_corpo, params) => {
      const resultado = consultar(params.id ?? '');
      return resultado.ok
        ? { status: 200, corpo: resultado.ingrediente }
        : { status: 404, corpo: { erro: resultado.erro } };
    },
  };
}
