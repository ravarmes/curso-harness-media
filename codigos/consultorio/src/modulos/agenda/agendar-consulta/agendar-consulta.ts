import { falha, type Resultado } from '../../../compartilhado/resultado.ts';
import type { RepositorioAgenda } from '../repositorio.ts';
import { diaDe, lerInstante, MINUTO_MS, paraBrasilia, paraUtc } from '../tempo.ts';

// O que a agenda precisa saber dos outros módulos (vem dos index.ts deles).
export type Contexto = {
  repo: RepositorioAgenda;
  pacienteExiste: (id: number) => boolean;
  profissionalExiste: (id: number) => boolean;
  expedienteDe: (profissionalId: number) => { dia_semana: number; inicio_min: number; fim_min: number }[];
};

export type ConsultaAgendada = { id: number; paciente_id: number; profissional_id: number; inicio: string; fim: string };

const idPositivo = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0;

export function agendarConsulta(ctx: Contexto, dados: unknown): Resultado<{ consulta: ConsultaAgendada }> {
  const corpo = (typeof dados === 'object' && dados !== null ? dados : {}) as Record<string, unknown>;
  if (!idPositivo(corpo.paciente_id)) return falha('malformado', 'paciente_id deve ser um número inteiro positivo');
  if (!idPositivo(corpo.profissional_id)) return falha('malformado', 'profissional_id deve ser um número inteiro positivo');
  const inicio = lerInstante(corpo.inicio);
  const fim = lerInstante(corpo.fim);
  if (inicio === undefined || fim === undefined) {
    return falha('malformado', 'inicio e fim devem estar em ISO 8601 com offset, ex.: 2026-11-10T14:00:00-03:00');
  }
  if (inicio >= fim) return falha('malformado', 'O início deve ser anterior ao fim');

  if (!ctx.pacienteExiste(corpo.paciente_id)) return falha('inexistente', 'Paciente não encontrado');
  if (!ctx.profissionalExiste(corpo.profissional_id)) return falha('inexistente', 'Profissional não encontrado');

  // O expediente é por dia de Brasília: a consulta tem de caber num dia só (o fim pode ser a meia-noite).
  const dia = diaDe(inicio);
  const inicioMin = (inicio - dia.inicioMs) / MINUTO_MS;
  const fimMin = (fim - dia.inicioMs) / MINUTO_MS;
  // Faixas encostadas (08-12 e 12-18) valem como um expediente contínuo.
  let coberto = inicioMin;
  for (const f of ctx.expedienteDe(corpo.profissional_id)) {
    if (f.dia_semana === dia.diaSemana && f.inicio_min <= coberto && f.fim_min > coberto) coberto = f.fim_min;
  }
  if (fimMin > 24 * 60 || coberto < fimMin) return falha('recusado', 'A consulta está fora do expediente do profissional');

  const inicioUtc = paraUtc(inicio);
  const fimUtc = paraUtc(fim);
  if (ctx.repo.profissionalOcupado(corpo.profissional_id, inicioUtc, fimUtc)) {
    return falha('recusado', 'O profissional já tem consulta nesse horário');
  }
  if (ctx.repo.pacienteOcupado(corpo.paciente_id, inicioUtc, fimUtc)) {
    return falha('recusado', 'O paciente já tem consulta nesse horário');
  }

  const salva = ctx.repo.inserir({
    paciente_id: corpo.paciente_id,
    profissional_id: corpo.profissional_id,
    inicio_utc: inicioUtc,
    fim_utc: fimUtc,
  });
  return {
    ok: true,
    consulta: {
      id: salva.id,
      paciente_id: salva.paciente_id,
      profissional_id: salva.profissional_id,
      inicio: paraBrasilia(inicio),
      fim: paraBrasilia(fim),
    },
  };
}
