import type { Rota } from '../../../compartilhado/http.ts';
import type { ResultadoConsultarItem } from './consultar-item.ts';

export function rotaConsultarItem(consultar: (id: string) => ResultadoConsultarItem): Rota {
  return {
    metodo: 'GET',
    caminho: '/cardapio/:id',
    manipulador: (_corpo, params) => {
      const resultado = consultar(params.id ?? '');
      return resultado.ok ? { status: 200, corpo: resultado.item } : { status: 404, corpo: { erro: resultado.erro } };
    },
  };
}
