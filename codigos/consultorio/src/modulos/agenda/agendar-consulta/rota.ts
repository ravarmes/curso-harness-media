import { respostaDeErro, type Rota } from '../../../compartilhado/http.ts';
import { agendarConsulta } from './agendar-consulta.ts';

export function rotaAgendarConsulta(ctx: Parameters<typeof agendarConsulta>[0]): Rota {
  return {
    metodo: 'POST',
    caminho: '/consultas',
    manipulador: (corpo) => {
      const resultado = agendarConsulta(ctx, corpo);
      return resultado.ok ? { status: 201, corpo: resultado.consulta } : respostaDeErro(resultado.erro);
    },
  };
}
