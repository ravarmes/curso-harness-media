import { respostaDeErro, type Rota } from '../../../compartilhado/http.ts';
import { remarcarConsulta } from './remarcar-consulta.ts';

export function rotaRemarcarConsulta(ctx: Parameters<typeof remarcarConsulta>[0]): Rota {
  return {
    metodo: 'POST',
    caminho: '/consultas/:id/remarcacao',
    manipulador: (corpo, params) => {
      const resultado = remarcarConsulta(ctx, params.id, corpo);
      return resultado.ok ? { status: 200, corpo: resultado.consulta } : respostaDeErro(resultado.erro);
    },
  };
}
