import type { Rota } from '../../../compartilhado/http.ts';
import type { ResultadoCadastrarIngrediente } from './cadastrar-ingrediente.ts';

// Só traduz: corpo HTTP para a regra, resultado da regra para HTTP.
export function rotaCadastrarIngrediente(
  cadastrar: (nome: unknown, quantidade: unknown) => ResultadoCadastrarIngrediente,
): Rota {
  return {
    metodo: 'POST',
    caminho: '/estoque',
    manipulador: (corpo) => {
      const dados = (corpo ?? {}) as { nome?: unknown; quantidade?: unknown };
      const resultado = cadastrar(dados.nome, dados.quantidade);
      if (resultado.ok) return { status: 201, corpo: resultado.ingrediente };
      return { status: resultado.tipo === 'duplicado' ? 409 : 400, corpo: { erro: resultado.erro } };
    },
  };
}
