import { respostaDeErro, type Rota } from '../../../compartilhado/http.ts';
import { sairDaLista } from './sair-da-lista.ts';

export function rotaSairDaLista(ctx: Parameters<typeof sairDaLista>[0]): Rota {
  return {
    metodo: 'DELETE',
    caminho: '/lista-de-espera/:id',
    manipulador: (_corpo, params) => {
      const resultado = sairDaLista(ctx, params.id);
      return resultado.ok ? { status: 200, corpo: resultado.entrada } : respostaDeErro(resultado.erro);
    },
  };
}
