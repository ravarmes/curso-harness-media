import { respostaDeErro, type Rota } from '../../../compartilhado/http.ts';
import { definirExpediente } from './definir-expediente.ts';

export function rotaDefinirExpediente(repo: Parameters<typeof definirExpediente>[0]): Rota {
  return {
    metodo: 'PUT',
    caminho: '/profissionais/:id/expediente',
    manipulador: (corpo, params) => {
      const resultado = definirExpediente(repo, params.id, corpo);
      return resultado.ok ? { status: 200, corpo: { faixas: resultado.faixas } } : respostaDeErro(resultado.erro);
    },
  };
}
