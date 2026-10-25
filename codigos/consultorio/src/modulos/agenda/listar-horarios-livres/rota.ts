import { respostaDeErro, type Rota } from '../../../compartilhado/http.ts';
import { listarHorariosLivres } from './listar-horarios-livres.ts';

export function rotaListarHorariosLivres(ctx: Parameters<typeof listarHorariosLivres>[0]): Rota {
  return {
    metodo: 'GET',
    caminho: '/profissionais/:id/horarios-livres/:data',
    manipulador: (_corpo, params) => {
      const resultado = listarHorariosLivres(ctx, params.id, params.data);
      return resultado.ok ? { status: 200, corpo: resultado.horarios } : respostaDeErro(resultado.erro);
    },
  };
}
