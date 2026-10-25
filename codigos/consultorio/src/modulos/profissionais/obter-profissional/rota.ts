import { respostaDeErro, type Rota } from '../../../compartilhado/http.ts';
import { obterProfissional } from './obter-profissional.ts';

export function rotaObterProfissional(repo: Parameters<typeof obterProfissional>[0]): Rota {
  return {
    metodo: 'GET',
    caminho: '/profissionais/:id',
    manipulador: (_corpo, params) => {
      const resultado = obterProfissional(repo, params.id);
      return resultado.ok ? { status: 200, corpo: resultado.profissional } : respostaDeErro(resultado.erro);
    },
  };
}
