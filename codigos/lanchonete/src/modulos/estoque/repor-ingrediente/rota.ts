import type { Rota } from '../../../compartilhado/http.ts';
import type { ResultadoReporIngrediente } from './repor-ingrediente.ts';

export function rotaReporIngrediente(repor: (id: string, quantidade: unknown) => ResultadoReporIngrediente): Rota {
  return {
    metodo: 'POST',
    caminho: '/estoque/:id/reposicao',
    manipulador: (corpo, params) => {
      const dados = (corpo ?? {}) as { quantidade?: unknown };
      const resultado = repor(params.id ?? '', dados.quantidade);
      if (resultado.ok) return { status: 200, corpo: resultado.ingrediente };
      return { status: resultado.tipo === 'inexistente' ? 404 : 400, corpo: { erro: resultado.erro } };
    },
  };
}
