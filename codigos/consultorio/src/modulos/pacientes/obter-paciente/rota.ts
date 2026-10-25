import { respostaDeErro, type Rota } from '../../../compartilhado/http.ts';
import { obterPaciente } from './obter-paciente.ts';

export function rotaObterPaciente(repo: Parameters<typeof obterPaciente>[0]): Rota {
  return {
    metodo: 'GET',
    caminho: '/pacientes/:id',
    manipulador: (_corpo, params) => {
      const resultado = obterPaciente(repo, params.id);
      return resultado.ok ? { status: 200, corpo: resultado.paciente } : respostaDeErro(resultado.erro);
    },
  };
}
