import { respostaDeErro, type Rota } from '../../../compartilhado/http.ts';
import { cadastrarProfissional } from './cadastrar-profissional.ts';

export function rotaCadastrarProfissional(repo: Parameters<typeof cadastrarProfissional>[0]): Rota {
  return {
    metodo: 'POST',
    caminho: '/profissionais',
    manipulador: (corpo) => {
      const resultado = cadastrarProfissional(repo, corpo);
      return resultado.ok ? { status: 201, corpo: resultado.profissional } : respostaDeErro(resultado.erro);
    },
  };
}
