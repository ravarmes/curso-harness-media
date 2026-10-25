import { respostaDeErro, type Rota } from '../../../compartilhado/http.ts';
import { cadastrarPaciente } from './cadastrar-paciente.ts';

export function rotaCadastrarPaciente(repo: Parameters<typeof cadastrarPaciente>[0]): Rota {
  return {
    metodo: 'POST',
    caminho: '/pacientes',
    manipulador: (corpo) => {
      const resultado = cadastrarPaciente(repo, corpo);
      return resultado.ok ? { status: 201, corpo: resultado.paciente } : respostaDeErro(resultado.erro);
    },
  };
}
