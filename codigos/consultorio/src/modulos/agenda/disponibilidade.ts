import { falha } from '../../compartilhado/resultado.ts';
import type { Contexto } from './agendar-consulta/agendar-consulta.ts';
import { diaDe, MINUTO_MS, paraUtc } from '../../compartilhado/tempo.ts';

// Confere expediente e ocupação de um horário (ms UTC). `ignorar` é a consulta que está sendo remarcada.
export function conferirHorario(
  ctx: Contexto,
  profissionalId: number,
  pacienteId: number,
  inicio: number,
  fim: number,
  ignorar?: number,
) {
  // O expediente é por dia de Brasília: a consulta tem de caber num dia só (o fim pode ser a meia-noite).
  const dia = diaDe(inicio);
  const inicioMin = (inicio - dia.inicioMs) / MINUTO_MS;
  const fimMin = (fim - dia.inicioMs) / MINUTO_MS;
  // Faixas encostadas (08-12 e 12-18) valem como um expediente contínuo.
  let coberto = inicioMin;
  for (const f of ctx.expedienteDe(profissionalId)) {
    if (f.dia_semana === dia.diaSemana && f.inicio_min <= coberto && f.fim_min > coberto) coberto = f.fim_min;
  }
  if (fimMin > 24 * 60 || coberto < fimMin)
    return falha('recusado', 'A consulta está fora do expediente do profissional');

  const inicioUtc = paraUtc(inicio);
  const fimUtc = paraUtc(fim);
  if (ctx.repo.profissionalOcupado(profissionalId, inicioUtc, fimUtc, ignorar)) {
    return falha('recusado', 'O profissional já tem consulta nesse horário');
  }
  if (ctx.repo.pacienteOcupado(pacienteId, inicioUtc, fimUtc, ignorar)) {
    return falha('recusado', 'O paciente já tem consulta nesse horário');
  }
  return undefined;
}
