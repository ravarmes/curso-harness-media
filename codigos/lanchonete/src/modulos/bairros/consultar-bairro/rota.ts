import type { Rota } from '../../../compartilhado/http.ts';
import type { ResultadoConsultarBairro } from './consultar-bairro.ts';

export function rotaConsultarBairro(consultar: (id: string) => ResultadoConsultarBairro): Rota {
  return {
    metodo: 'GET',
    caminho: '/bairros/:id',
    manipulador: (_corpo, params) => {
      const resultado = consultar(params.id ?? '');
      return resultado.ok ? { status: 200, corpo: resultado.bairro } : { status: 404, corpo: { erro: resultado.erro } };
    },
  };
}
