import type { Rota } from '../../../compartilhado/http.ts';
import type { ResultadoCriarPedido } from './criar-pedido.ts';

// Só traduz: corpo HTTP para a regra, resultado da regra para HTTP.
export function rotaCriarPedido(criar: (corpo: unknown) => ResultadoCriarPedido): Rota {
  return {
    metodo: 'POST',
    caminho: '/pedidos',
    manipulador: (corpo) => {
      const resultado = criar(corpo);
      if (resultado.ok) return { status: 201, corpo: resultado.pedido };
      return { status: resultado.tipo === 'recusado' ? 409 : 400, corpo: { erro: resultado.erro } };
    },
  };
}
