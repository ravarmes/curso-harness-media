import type { Rota } from '../../../compartilhado/http.ts';
import type { ResultadoCriarNota } from './criar-nota.ts';

// Só traduz: corpo HTTP para a regra, resultado da regra para HTTP.
export function rotaCriarNota(criar: (texto: unknown) => ResultadoCriarNota): Rota {
  return {
    metodo: 'POST',
    caminho: '/notas',
    manipulador: (corpo) => {
      const resultado = criar((corpo as { texto?: unknown } | undefined)?.texto);
      return resultado.ok
        ? { status: 201, corpo: resultado.nota }
        : { status: 400, corpo: { erro: resultado.erro } };
    },
  };
}
