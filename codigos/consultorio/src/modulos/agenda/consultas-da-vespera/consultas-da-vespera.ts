import type { Contexto } from '../agendar-consulta/agendar-consulta.ts';
import { DIA_MS, diaDe, paraBrasilia, paraUtc } from '../tempo.ts';

export type ConsultaDaVespera = { id: number; paciente_id: number; profissional_id: number; inicio: string };

// Consultas agendadas, de todos os profissionais, que começam no dia seguinte
// ao de `agoraMs` (dia de Brasília).
export function consultasDaVespera(ctx: Contexto, agoraMs: number): ConsultaDaVespera[] {
  const inicioDeAmanha = diaDe(agoraMs).inicioMs + DIA_MS;
  return ctx.repo.noPeriodo(paraUtc(inicioDeAmanha), paraUtc(inicioDeAmanha + DIA_MS)).map((c) => ({
    id: c.id,
    paciente_id: c.paciente_id,
    profissional_id: c.profissional_id,
    inicio: paraBrasilia(Date.parse(c.inicio_utc)),
  }));
}
