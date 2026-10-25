import { respostaDeErro, type Rota } from '../../../compartilhado/http.ts';
import { cancelarConsulta } from './cancelar-consulta.ts';

export function rotaCancelarConsulta(ctx: Parameters<typeof cancelarConsulta>[0]): Rota {
  return {
    metodo: 'POST',
    caminho: '/consultas/:id/cancelamento',
    manipulador: (corpo, params) => {
      const resultado = cancelarConsulta(ctx, params.id, corpo);
      return resultado.ok ? { status: 200, corpo: resultado.consulta } : respostaDeErro(resultado.erro);
    },
  };
}
