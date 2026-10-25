import { falha, lerId, type Resultado } from '../../../compartilhado/resultado.ts';
import { minutosParaHhmm } from '../horario.ts';
import type { RepositorioProfissionais } from '../repositorio.ts';

export type Faixa = { dia_semana: number; inicio: string; fim: string };

export function obterExpediente(repo: RepositorioProfissionais, id: string): Resultado<{ faixas: Faixa[] }> {
  const numero = lerId(id);
  if (numero === undefined) return falha('malformado', 'O id do profissional deve ser um número inteiro');
  if (!repo.buscar(numero)) return falha('inexistente', 'Profissional não encontrado');
  return {
    ok: true,
    faixas: repo.expediente(numero).map((f) => ({
      dia_semana: f.dia_semana,
      inicio: minutosParaHhmm(f.inicio_min),
      fim: minutosParaHhmm(f.fim_min),
    })),
  };
}
