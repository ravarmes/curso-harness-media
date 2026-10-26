import { falha, lerId, type Resultado } from '../../../compartilhado/resultado.ts';
import type { Contexto, EntradaNaLista } from '../entrar-na-lista/entrar-na-lista.ts';
import { paraBrasilia } from '../../../compartilhado/tempo.ts';

export function sairDaLista(ctx: Contexto, id: string): Resultado<{ entrada: EntradaNaLista }> {
  const numero = lerId(id);
  if (!numero) return falha('malformado', 'O id da entrada deve ser um número inteiro');
  const entrada = ctx.repo.porId(numero);
  if (!entrada) return falha('inexistente', 'Entrada da lista de espera não encontrada');

  ctx.repo.remover(numero);
  return {
    ok: true,
    entrada: {
      id: entrada.id,
      paciente_id: entrada.paciente_id,
      profissional_id: entrada.profissional_id,
      data: entrada.data,
      entrou_em: paraBrasilia(Date.parse(entrada.entrou_em_utc)),
    },
  };
}
