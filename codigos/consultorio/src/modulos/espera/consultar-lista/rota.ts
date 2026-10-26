import { respostaDeErro, type Rota } from '../../../compartilhado/http.ts';
import { consultarLista } from './consultar-lista.ts';

export function rotaConsultarLista(ctx: Parameters<typeof consultarLista>[0]): Rota {
  return {
    metodo: 'GET',
    caminho: '/profissionais/:id/lista-de-espera/:data',
    manipulador: (_corpo, params) => {
      const resultado = consultarLista(ctx, params.id, params.data);
      return resultado.ok ? { status: 200, corpo: resultado.lista } : respostaDeErro(resultado.erro);
    },
  };
}
