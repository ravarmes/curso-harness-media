import { falha, lerId, type Resultado } from '../../../compartilhado/resultado.ts';
import type { Contexto } from '../agendar-consulta/agendar-consulta.ts';
import { diaDe, inicioDoDia, MINUTO_MS, paraBrasilia, paraUtc } from '../../../compartilhado/tempo.ts';

export type HorariosLivres = {
  profissional_id: number;
  data: string;
  duracao_min: number;
  horarios: { inicio: string; fim: string }[];
};

const DURACAO_MIN = 30;

// `data` é o dia de Brasília, no formato AAAA-MM-DD.
export function listarHorariosLivres(ctx: Contexto, id: string, data: string): Resultado<{ horarios: HorariosLivres }> {
  const numero = lerId(id);
  if (numero === undefined) return falha('malformado', 'O id do profissional deve ser um número inteiro');
  const inicioDia = inicioDoDia(data);
  if (inicioDia === undefined) return falha('malformado', 'A data deve estar no formato AAAA-MM-DD');
  if (!ctx.profissionalExiste(numero)) return falha('inexistente', 'Profissional não encontrado');

  // Faixas encostadas (08-12 e 12-18) valem como um expediente contínuo, como no agendamento.
  const faixas: { inicio_min: number; fim_min: number }[] = [];
  const doDia = ctx
    .expedienteDe(numero)
    .filter((f) => f.dia_semana === diaDe(inicioDia).diaSemana)
    .sort((a, b) => a.inicio_min - b.inicio_min);
  for (const f of doDia) {
    const ultima = faixas.at(-1);
    if (ultima && f.inicio_min <= ultima.fim_min) ultima.fim_min = Math.max(ultima.fim_min, f.fim_min);
    else faixas.push({ inicio_min: f.inicio_min, fim_min: f.fim_min });
  }

  const agora = ctx.agora();
  const horarios: HorariosLivres['horarios'] = [];
  for (const faixa of faixas) {
    for (let min = faixa.inicio_min; min + DURACAO_MIN <= faixa.fim_min; min += DURACAO_MIN) {
      const inicio = inicioDia + min * MINUTO_MS;
      const fim = inicio + DURACAO_MIN * MINUTO_MS;
      if (inicio <= agora) continue;
      if (ctx.repo.profissionalOcupado(numero, paraUtc(inicio), paraUtc(fim))) continue;
      horarios.push({ inicio: paraBrasilia(inicio), fim: paraBrasilia(fim) });
    }
  }
  return { ok: true, horarios: { profissional_id: numero, data, duracao_min: DURACAO_MIN, horarios } };
}
