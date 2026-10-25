import { respostaDeErro, type Rota } from '../../../compartilhado/http.ts';
import { obterExpediente } from './obter-expediente.ts';

export function rotaObterExpediente(repo: Parameters<typeof obterExpediente>[0]): Rota {
  return {
    metodo: 'GET',
    caminho: '/profissionais/:id/expediente',
    manipulador: (_corpo, params) => {
      const resultado = obterExpediente(repo, params.id);
      return resultado.ok ? { status: 200, corpo: { faixas: resultado.faixas } } : respostaDeErro(resultado.erro);
    },
  };
}
