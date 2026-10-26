import type { Rota } from '../../../compartilhado/http.ts';
import type { ResultadoCadastrarCupom } from './cadastrar-cupom.ts';

// Só traduz: corpo HTTP para a regra, resultado da regra para HTTP.
export function rotaCadastrarCupom(cadastrar: (codigo: unknown, percentual: unknown) => ResultadoCadastrarCupom): Rota {
  return {
    metodo: 'POST',
    caminho: '/cupons',
    manipulador: (corpo) => {
      const dados = (corpo ?? {}) as { codigo?: unknown; percentual?: unknown };
      const resultado = cadastrar(dados.codigo, dados.percentual);
      if (resultado.ok) return { status: 201, corpo: resultado.cupom };
      return { status: resultado.tipo === 'duplicado' ? 409 : 400, corpo: { erro: resultado.erro } };
    },
  };
}
