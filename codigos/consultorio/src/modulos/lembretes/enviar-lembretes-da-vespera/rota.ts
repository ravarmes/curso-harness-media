import { respostaDeErro, type Rota } from '../../../compartilhado/http.ts';
import { enviarLembretesDaVespera } from './enviar-lembretes-da-vespera.ts';

export function rotaEnviarLembretesDaVespera(ctx: Parameters<typeof enviarLembretesDaVespera>[0]): Rota {
  return {
    metodo: 'POST',
    caminho: '/lembretes/enviar-da-vespera',
    manipulador: async () => {
      const resultado = await enviarLembretesDaVespera(ctx);
      if (!resultado.ok) return respostaDeErro(resultado.erro);
      const { enviados, falhas, jaEnviados } = resultado;
      return { status: 200, corpo: { enviados, falhas, jaEnviados } };
    },
  };
}
