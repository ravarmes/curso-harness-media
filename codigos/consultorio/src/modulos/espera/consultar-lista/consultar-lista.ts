import { falha, lerId, type Resultado } from '../../../compartilhado/resultado.ts';
import { inicioDoDia, paraBrasilia } from '../../../compartilhado/tempo.ts';
import type { Contexto } from '../entrar-na-lista/entrar-na-lista.ts';

export type Fila = {
  profissional_id: number;
  data: string;
  fila: { posicao: number; id: number; paciente_id: number; entrou_em: string }[];
};

// `data` é o dia de Brasília, no formato AAAA-MM-DD.
export function consultarLista(ctx: Contexto, id: string, data: string): Resultado<{ lista: Fila }> {
  const numero = lerId(id);
  if (numero === undefined) return falha('malformado', 'O id do profissional deve ser um número inteiro');
  if (inicioDoDia(data) === undefined) return falha('malformado', 'A data deve estar no formato AAAA-MM-DD');
  if (!ctx.profissionalExiste(numero)) return falha('inexistente', 'Profissional não encontrado');

  return {
    ok: true,
    lista: {
      profissional_id: numero,
      data,
      fila: ctx.repo.daFila(numero, data).map((e, i) => ({
        posicao: i + 1,
        id: e.id,
        paciente_id: e.paciente_id,
        entrou_em: paraBrasilia(Date.parse(e.entrou_em_utc)),
      })),
    },
  };
}
