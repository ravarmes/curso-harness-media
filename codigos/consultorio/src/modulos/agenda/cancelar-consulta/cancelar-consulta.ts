import { falha, lerId, type Resultado } from '../../../compartilhado/resultado.ts';
import type { ConsultaAgendada, Contexto } from '../agendar-consulta/agendar-consulta.ts';
import { paraBrasilia } from '../tempo.ts';

export type ConsultaCancelada = ConsultaAgendada & { status: 'cancelada' };

const PRAZO_DO_PACIENTE_MS = 24 * 60 * 60_000;

export function cancelarConsulta(
  ctx: Contexto,
  id: string,
  dados: unknown,
): Resultado<{ consulta: ConsultaCancelada }> {
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

  const consulta = ctx.repo.porId(numero);
  if (!consulta) return falha('inexistente', 'Consulta não encontrada');
  if (corpo.quem === 'paciente' && consulta.paciente_id !== pacienteId) {
    return falha('recusado', 'a consulta não pertence a esse paciente');
  }
  if (consulta.status === 'cancelada') return falha('recusado', 'a consulta já está cancelada');

  const inicio = Date.parse(consulta.inicio_utc);
  const faltam = inicio - ctx.agora();
  if (faltam <= 0) return falha('recusado', 'a consulta já começou');
  if (corpo.quem === 'paciente' && faltam < PRAZO_DO_PACIENTE_MS) {
    return falha('recusado', 'o paciente só cancela até 24 h antes');
  }

  ctx.repo.cancelar(numero);
  return {
    ok: true,
    consulta: {
      id: consulta.id,
      paciente_id: consulta.paciente_id,
      profissional_id: consulta.profissional_id,
      inicio: paraBrasilia(inicio),
      fim: paraBrasilia(Date.parse(consulta.fim_utc)),
      status: 'cancelada',
    },
  };
}
