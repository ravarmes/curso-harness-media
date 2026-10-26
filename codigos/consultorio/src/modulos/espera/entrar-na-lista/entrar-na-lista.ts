import { falha, type Resultado } from '../../../compartilhado/resultado.ts';
import type { RepositorioEspera } from '../repositorio.ts';
import { diaDe, inicioDoDia, paraBrasilia, paraUtc } from '../../../compartilhado/tempo.ts';

export type Contexto = {
  repo: RepositorioEspera;
  agora: () => number; // ms UTC; injetável para os testes
  pacienteExiste: (id: number) => boolean;
  profissionalExiste: (id: number) => boolean;
};

export type EntradaNaLista = {
  id: number;
  paciente_id: number;
  profissional_id: number;
  data: string;
  entrou_em: string;
};

const idPositivo = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0;

// `data` é o dia de Brasília, no formato AAAA-MM-DD.
export function entrarNaLista(ctx: Contexto, dados: unknown): Resultado<{ entrada: EntradaNaLista }> {
  const corpo = (typeof dados === 'object' && dados !== null ? dados : {}) as Record<string, unknown>;
  if (!idPositivo(corpo.paciente_id)) return falha('malformado', 'paciente_id deve ser um número inteiro positivo');
  if (!idPositivo(corpo.profissional_id))
    return falha('malformado', 'profissional_id deve ser um número inteiro positivo');
  const inicio = inicioDoDia(corpo.data);
  if (inicio === undefined) return falha('malformado', 'A data deve estar no formato AAAA-MM-DD');

  if (!ctx.pacienteExiste(corpo.paciente_id)) return falha('inexistente', 'Paciente não encontrado');
  if (!ctx.profissionalExiste(corpo.profissional_id)) return falha('inexistente', 'Profissional não encontrado');

  const agora = ctx.agora();
  if (inicio < diaDe(agora).inicioMs) {
    return falha('recusado', 'A data da lista de espera não pode ser anterior a hoje');
  }
  if (ctx.repo.jaNaLista(corpo.paciente_id, corpo.profissional_id, corpo.data as string)) {
    return falha('recusado', 'O paciente já está na lista de espera deste profissional neste dia');
  }

  const salva = ctx.repo.inserir({
    paciente_id: corpo.paciente_id,
    profissional_id: corpo.profissional_id,
    data: corpo.data as string,
    entrou_em_utc: paraUtc(agora),
  });
  return {
    ok: true,
    entrada: {
      id: salva.id,
      paciente_id: salva.paciente_id,
      profissional_id: salva.profissional_id,
      data: salva.data,
      entrou_em: paraBrasilia(agora),
    },
  };
}
