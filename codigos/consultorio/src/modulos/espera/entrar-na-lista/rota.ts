import { respostaDeErro, type Rota } from '../../../compartilhado/http.ts';
import { entrarNaLista } from './entrar-na-lista.ts';

export function rotaEntrarNaLista(ctx: Parameters<typeof entrarNaLista>[0]): Rota {
  return {
    metodo: 'POST',
    caminho: '/lista-de-espera',
    manipulador: (corpo) => {
      const resultado = entrarNaLista(ctx, corpo);
      return resultado.ok ? { status: 201, corpo: resultado.entrada } : respostaDeErro(resultado.erro);
    },
  };
}
