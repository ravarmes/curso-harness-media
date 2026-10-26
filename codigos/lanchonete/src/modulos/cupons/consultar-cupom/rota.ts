import type { Rota } from '../../../compartilhado/http.ts';
import type { ResultadoConsultarCupom } from './consultar-cupom.ts';

export function rotaConsultarCupom(consultar: (codigo: string) => ResultadoConsultarCupom): Rota {
  return {
    metodo: 'GET',
    caminho: '/cupons/:codigo',
    manipulador: (_corpo, params) => {
      const resultado = consultar(params.codigo ?? '');
      return resultado.ok ? { status: 200, corpo: resultado.cupom } : { status: 404, corpo: { erro: resultado.erro } };
    },
  };
}
