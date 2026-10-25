import { falha, lerId, type Resultado } from '../../../compartilhado/resultado.ts';
import { hhmmParaMinutos } from '../horario.ts';
import type { FaixaDeExpediente, RepositorioProfissionais } from '../repositorio.ts';
import { obterExpediente, type Faixa } from '../obter-expediente/obter-expediente.ts';

// Lê as faixas do corpo; devolve a mensagem de erro quando algo está malformado.
function lerFaixas(dados: unknown): FaixaDeExpediente[] | string {
  const lista = typeof dados === 'object' && dados !== null ? (dados as { faixas?: unknown }).faixas : undefined;
  if (!Array.isArray(lista)) return 'O corpo deve ter a lista "faixas"';

  const faixas: FaixaDeExpediente[] = [];
  for (const item of lista) {
    const { dia_semana, inicio, fim } = (typeof item === 'object' && item !== null ? item : {}) as Record<
      string,
      unknown
    >;
    if (typeof dia_semana !== 'number' || !Number.isInteger(dia_semana) || dia_semana < 0 || dia_semana > 6) {
      return 'Em cada faixa, dia_semana deve ser um inteiro de 0 (segunda) a 6 (domingo)';
    }
    const inicio_min = hhmmParaMinutos(inicio);
    const fim_min = hhmmParaMinutos(fim);
    if (inicio_min === undefined || fim_min === undefined)
      return 'Em cada faixa, inicio e fim devem estar no formato HH:MM';
    if (inicio_min >= fim_min) return 'Em cada faixa, o início deve ser anterior ao fim';
    faixas.push({ dia_semana, inicio_min, fim_min });
  }

  faixas.sort((a, b) => a.dia_semana - b.dia_semana || a.inicio_min - b.inicio_min);
  for (let i = 1; i < faixas.length; i++) {
    if (faixas[i].dia_semana === faixas[i - 1].dia_semana && faixas[i].inicio_min < faixas[i - 1].fim_min) {
      return 'Faixas do mesmo dia não podem se sobrepor';
    }
  }
  return faixas;
}

// Substitui o expediente inteiro do profissional. Consultas já agendadas não são afetadas.
export function definirExpediente(
  repo: RepositorioProfissionais,
  id: string,
  dados: unknown,
): Resultado<{ faixas: Faixa[] }> {
  const numero = lerId(id);
  if (numero === undefined) return falha('malformado', 'O id do profissional deve ser um número inteiro');
  const faixas = lerFaixas(dados);
  if (typeof faixas === 'string') return falha('malformado', faixas);
  if (!repo.buscar(numero)) return falha('inexistente', 'Profissional não encontrado');

  repo.substituirExpediente(numero, faixas);
  return obterExpediente(repo, id);
}
