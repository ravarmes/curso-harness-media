import { falha, lerId, type Resultado } from '../../../compartilhado/resultado.ts';
import type { ConsultaAgendada, Contexto } from '../agendar-consulta/agendar-consulta.ts';
import { paraBrasilia } from '../../../compartilhado/tempo.ts';

export type ConsultaComFalta = ConsultaAgendada & { status: 'faltou' };

export function registrarFalta(ctx: Contexto, id: string): Resultado<{ consulta: ConsultaComFalta }> {
  const numero = lerId(id);
  if (numero === undefined) return falha('malformado', 'O id da consulta deve ser um número inteiro');

  const consulta = ctx.repo.porId(numero);
  if (!consulta) return falha('inexistente', 'Consulta não encontrada');
  if (consulta.status === 'cancelada') return falha('recusado', 'a consulta está cancelada');
  if (consulta.status === 'faltou') return falha('recusado', 'a falta já está registrada');

  const fim = Date.parse(consulta.fim_utc);
  if (fim > ctx.agora()) return falha('recusado', 'a consulta ainda não terminou');

  ctx.repo.registrarFalta(numero);
  return {
    ok: true,
    consulta: {
      id: consulta.id,
      paciente_id: consulta.paciente_id,
      profissional_id: consulta.profissional_id,
      inicio: paraBrasilia(Date.parse(consulta.inicio_utc)),
      fim: paraBrasilia(fim),
      status: 'faltou',
    },
  };
}
