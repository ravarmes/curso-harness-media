import type { Rota } from '../../../compartilhado/http.ts';
import type { ResultadoConsultarReceita } from './consultar-receita.ts';

export function rotaConsultarReceita(consultar: (id: string) => ResultadoConsultarReceita): Rota {
  return {
    metodo: 'GET',
    caminho: '/cardapio/:id/receita',
    manipulador: (_corpo, params) => {
      const resultado = consultar(params.id ?? '');
      return resultado.ok
        ? { status: 200, corpo: resultado.receita }
        : { status: 404, corpo: { erro: resultado.erro } };
    },
  };
}
