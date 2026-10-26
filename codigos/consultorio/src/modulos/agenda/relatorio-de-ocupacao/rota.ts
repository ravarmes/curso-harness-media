import { respostaDeErro, type Rota } from '../../../compartilhado/http.ts';
import { relatorioDeOcupacao } from './relatorio-de-ocupacao.ts';

export function rotaRelatorioDeOcupacao(ctx: Parameters<typeof relatorioDeOcupacao>[0]): Rota {
  return {
    metodo: 'GET',
    caminho: '/relatorios/ocupacao/:de/:ate',
    manipulador: (_corpo, params) => {
      const resultado = relatorioDeOcupacao(ctx, params.de, params.ate);
      return resultado.ok ? { status: 200, corpo: resultado.relatorio } : respostaDeErro(resultado.erro);
    },
  };
}
