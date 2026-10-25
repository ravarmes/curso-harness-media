import { respostaDeErro, type Rota } from '../../../compartilhado/http.ts';
import { obterAgendaDoDia } from './obter-agenda-do-dia.ts';

export function rotaObterAgendaDoDia(ctx: Parameters<typeof obterAgendaDoDia>[0]): Rota {
  return {
    metodo: 'GET',
    caminho: '/profissionais/:id/agenda/:data',
    manipulador: (_corpo, params) => {
      const resultado = obterAgendaDoDia(ctx, params.id, params.data);
      return resultado.ok ? { status: 200, corpo: resultado.agenda } : respostaDeErro(resultado.erro);
    },
  };
}
