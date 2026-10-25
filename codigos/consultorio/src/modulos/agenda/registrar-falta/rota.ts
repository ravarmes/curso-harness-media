import { respostaDeErro, type Rota } from '../../../compartilhado/http.ts';
import { registrarFalta } from './registrar-falta.ts';

export function rotaRegistrarFalta(ctx: Parameters<typeof registrarFalta>[0]): Rota {
  return {
    metodo: 'POST',
    caminho: '/consultas/:id/falta',
    manipulador: (_corpo, params) => {
      const resultado = registrarFalta(ctx, params.id);
      return resultado.ok ? { status: 200, corpo: resultado.consulta } : respostaDeErro(resultado.erro);
    },
  };
}
