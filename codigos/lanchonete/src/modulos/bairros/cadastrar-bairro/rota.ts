import type { Rota } from '../../../compartilhado/http.ts';
import type { ResultadoCadastrarBairro } from './cadastrar-bairro.ts';

// Só traduz: corpo HTTP para a regra, resultado da regra para HTTP.
export function rotaCadastrarBairro(cadastrar: (nome: unknown, taxa: unknown) => ResultadoCadastrarBairro): Rota {
  return {
    metodo: 'POST',
    caminho: '/bairros',
    manipulador: (corpo) => {
      const dados = (corpo ?? {}) as { nome?: unknown; taxa?: unknown };
      const resultado = cadastrar(dados.nome, dados.taxa);
      if (resultado.ok) return { status: 201, corpo: resultado.bairro };
      return { status: resultado.tipo === 'duplicado' ? 409 : 400, corpo: { erro: resultado.erro } };
    },
  };
}
