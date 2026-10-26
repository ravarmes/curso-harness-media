import { falha, type Resultado } from '../../../compartilhado/resultado.ts';
import type { RepositorioAgenda } from '../repositorio.ts';
import { conferirHorario } from '../disponibilidade.ts';
import { DIA_MS, diaDe, lerInstante, paraBrasilia, paraUtc } from '../tempo.ts';

// O que a agenda precisa saber dos outros módulos (vem dos index.ts deles).
export type Contexto = {
  repo: RepositorioAgenda;
  agora: () => number; // ms UTC; injetável para os testes
  pacienteExiste: (id: number) => boolean;
  profissionalExiste: (id: number) => boolean;
  expedienteDe: (profissionalId: number) => { dia_semana: number; inicio_min: number; fim_min: number }[];
};

export type ConsultaAgendada = {
  id: number;
  paciente_id: number;
  profissional_id: number;
  inicio: string;
  fim: string;
};

const LIMITE_DE_FALTAS = 3;
const JANELA_DE_FALTAS_DIAS = 90;

const idPositivo = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0;

export function agendarConsulta(ctx: Contexto, dados: unknown): Resultado<{ consulta: ConsultaAgendada }> {
  const corpo = (typeof dados === 'object' && dados !== null ? dados : {}) as Record<string, unknown>;
  if (!idPositivo(corpo.paciente_id)) return falha('malformado', 'paciente_id deve ser um número inteiro positivo');
  if (!idPositivo(corpo.profissional_id))
    return falha('malformado', 'profissional_id deve ser um número inteiro positivo');
  const inicio = lerInstante(corpo.inicio);
  const fim = lerInstante(corpo.fim);
  if (inicio === undefined || fim === undefined) {
    return falha('malformado', 'inicio e fim devem estar em ISO 8601 com offset, ex.: 2026-11-10T14:00:00-03:00');
  }
  if (inicio >= fim) return falha('malformado', 'O início deve ser anterior ao fim');

  if (!ctx.pacienteExiste(corpo.paciente_id)) return falha('inexistente', 'Paciente não encontrado');
  if (!ctx.profissionalExiste(corpo.profissional_id)) return falha('inexistente', 'Profissional não encontrado');

  // A janela vai do início do dia de hoje (Brasília) menos 90 dias até agora.
  const desde = paraUtc(diaDe(ctx.agora()).inicioMs - JANELA_DE_FALTAS_DIAS * DIA_MS);
  const faltas = ctx.repo.faltasDoPaciente(corpo.paciente_id, desde);
  if (faltas >= LIMITE_DE_FALTAS) {
    return falha(
      'recusado',
      `o paciente tem ${faltas} faltas nos últimos ${JANELA_DE_FALTAS_DIAS} dias e não pode agendar`,
    );
  }

  const recusa = conferirHorario(ctx, corpo.profissional_id, corpo.paciente_id, inicio, fim);
  if (recusa) return recusa;

  const salva = ctx.repo.inserir({
    paciente_id: corpo.paciente_id,
    profissional_id: corpo.profissional_id,
    inicio_utc: paraUtc(inicio),
    fim_utc: paraUtc(fim),
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
