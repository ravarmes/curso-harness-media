import type { Rota } from '../../../compartilhado/http.ts';
import type { ResultadoDefinirReceita } from './definir-receita.ts';

export function rotaDefinirReceita(definir: (id: string, ingredientes: unknown) => ResultadoDefinirReceita): Rota {
  return {
    metodo: 'PUT',
    caminho: '/cardapio/:id/receita',
    manipulador: (corpo, params) => {
      const dados = (corpo ?? {}) as { ingredientes?: unknown };
      const resultado = definir(params.id ?? '', dados.ingredientes);
      if (resultado.ok) return { status: 200, corpo: resultado.receita };
      return { status: resultado.tipo === 'inexistente' ? 404 : 400, corpo: { erro: resultado.erro } };
    },
  };
}
