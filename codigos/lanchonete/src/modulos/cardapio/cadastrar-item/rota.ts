import type { Rota } from '../../../compartilhado/http.ts';
import type { ResultadoCadastrarItem } from './cadastrar-item.ts';

// Só traduz: corpo HTTP para a regra, resultado da regra para HTTP.
export function rotaCadastrarItem(cadastrar: (nome: unknown, preco: unknown) => ResultadoCadastrarItem): Rota {
  return {
    metodo: 'POST',
    caminho: '/cardapio',
    manipulador: (corpo) => {
      const dados = (corpo ?? {}) as { nome?: unknown; preco?: unknown };
      const resultado = cadastrar(dados.nome, dados.preco);
      if (resultado.ok) return { status: 201, corpo: resultado.item };
      return { status: resultado.tipo === 'duplicado' ? 409 : 400, corpo: { erro: resultado.erro } };
    },
  };
}
