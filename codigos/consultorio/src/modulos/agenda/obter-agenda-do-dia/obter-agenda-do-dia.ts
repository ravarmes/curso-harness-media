import { falha, lerId, type Resultado } from '../../../compartilhado/resultado.ts';
import type { ConsultaAgendada, Contexto } from '../agendar-consulta/agendar-consulta.ts';
import { DIA_MS, inicioDoDia, paraBrasilia, paraUtc } from '../../../compartilhado/tempo.ts';

export type AgendaDoDia = {
  profissional_id: number;
  data: string;
  consultas: Omit<ConsultaAgendada, 'profissional_id'>[];
};

// `data` é o dia de Brasília, no formato AAAA-MM-DD.
export function obterAgendaDoDia(ctx: Contexto, id: string, data: string): Resultado<{ agenda: AgendaDoDia }> {
  const numero = lerId(id);
  if (numero === undefined) return falha('malformado', 'O id do profissional deve ser um número inteiro');
  const inicio = inicioDoDia(data);
  if (inicio === undefined) return falha('malformado', 'A data deve estar no formato AAAA-MM-DD');
  if (!ctx.profissionalExiste(numero)) return falha('inexistente', 'Profissional não encontrado');

  const consultas = ctx.repo.doProfissionalNoPeriodo(numero, paraUtc(inicio), paraUtc(inicio + DIA_MS));
  return {
    ok: true,
    agenda: {
      profissional_id: numero,
      data,
      consultas: consultas.map((c) => ({
        id: c.id,
        paciente_id: c.paciente_id,
        inicio: paraBrasilia(Date.parse(c.inicio_utc)),
        fim: paraBrasilia(Date.parse(c.fim_utc)),
      })),
    },
  };
}
