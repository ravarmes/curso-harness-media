import { falha, lerId, type Resultado } from '../../../compartilhado/resultado.ts';
import type { ConsultaAgendada, Contexto } from '../agendar-consulta/agendar-consulta.ts';
import { conferirHorario } from '../disponibilidade.ts';
import { lerInstante, paraBrasilia, paraUtc } from '../tempo.ts';

export type ConsultaRemarcada = ConsultaAgendada & { status: 'agendada' };

const PRAZO_DO_PACIENTE_MS = 24 * 60 * 60_000;

export function remarcarConsulta(
  ctx: Contexto,
  id: string,
  dados: unknown,
): Resultado<{ consulta: ConsultaRemarcada }> {
  const numero = lerId(id);
  if (numero === undefined) return falha('malformado', 'O id da consulta deve ser um número inteiro');
  const corpo = (typeof dados === 'object' && dados !== null ? dados : {}) as Record<string, unknown>;
  if (corpo.quem !== 'paciente' && corpo.quem !== 'recepcao') {
    return falha('malformado', 'quem deve ser "paciente" ou "recepcao"');
  }
  const pacienteId = corpo.paciente_id;
  if (
    corpo.quem === 'paciente' &&
    !(typeof pacienteId === 'number' && Number.isInteger(pacienteId) && pacienteId > 0)
  ) {
    return falha('malformado', 'paciente_id deve ser um número inteiro positivo');
  }
  const novoInicio = lerInstante(corpo.inicio);
  const novoFim = lerInstante(corpo.fim);
  if (novoInicio === undefined || novoFim === undefined) {
    return falha('malformado', 'inicio e fim devem estar em ISO 8601 com offset, ex.: 2026-11-10T14:00:00-03:00');
  }
  if (novoInicio >= novoFim) return falha('malformado', 'O início deve ser anterior ao fim');

  const consulta = ctx.repo.porId(numero);
  if (!consulta) return falha('inexistente', 'Consulta não encontrada');
  if (corpo.quem === 'paciente' && consulta.paciente_id !== pacienteId) {
    return falha('recusado', 'a consulta não pertence a esse paciente');
  }
  if (consulta.status === 'cancelada') return falha('recusado', 'a consulta está cancelada');
  if (consulta.status !== 'agendada') return falha('recusado', 'a consulta não está agendada');

  const faltam = Date.parse(consulta.inicio_utc) - ctx.agora();
  if (faltam <= 0) return falha('recusado', 'a consulta já começou');
  if (corpo.quem === 'paciente' && faltam < PRAZO_DO_PACIENTE_MS) {
    return falha('recusado', 'o paciente só remarca até 24 h antes');
  }
  if (novoInicio < ctx.agora()) return falha('recusado', 'o novo horário já passou');

  const recusa = conferirHorario(ctx, consulta.profissional_id, consulta.paciente_id, novoInicio, novoFim, numero);
  if (recusa) return recusa;

  ctx.repo.remarcar(numero, paraUtc(novoInicio), paraUtc(novoFim));
  return {
    ok: true,
    consulta: {
      id: consulta.id,
      paciente_id: consulta.paciente_id,
      profissional_id: consulta.profissional_id,
      inicio: paraBrasilia(novoInicio),
      fim: paraBrasilia(novoFim),
      status: 'agendada',
    },
  };
}
