import type { Dependencias, Receita } from '../dependencias.ts';
import type { LinhaDaReceita, RepositorioDeReceitas } from '../repositorio.ts';

export type ResultadoDefinirReceita =
  { ok: true; receita: Receita } | { ok: false; tipo: 'invalido' | 'inexistente'; erro: string };

const invalido = (erro: string): ResultadoDefinirReceita => ({ ok: false, tipo: 'invalido', erro });
const ehInteiro = (valor: unknown): valor is number => typeof valor === 'number' && Number.isInteger(valor);

// Valida a forma do corpo, depois o item da URL, depois os ingredientes
// citados. O id chega como texto da URL; o que não for inteiro positivo não
// existe. A troca da receita só acontece com tudo válido.
export function definirReceita(
  repo: Pick<RepositorioDeReceitas, 'substituir'>,
  deps: Dependencias,
  id: string,
  ingredientes: unknown,
): ResultadoDefinirReceita {
  if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
    return invalido('receita deve ter ao menos um ingrediente');
  }
  const linhas: LinhaDaReceita[] = [];
  for (const entrada of ingredientes as { ingredienteId?: unknown; quantidade?: unknown }[]) {
    const { ingredienteId, quantidade } = entrada ?? {};
    if (!ehInteiro(ingredienteId)) return invalido('ingredienteId deve ser um inteiro');
    if (!ehInteiro(quantidade) || quantidade <= 0) return invalido('quantidade deve ser um inteiro positivo');
    if (linhas.some((l) => l.ingredienteId === ingredienteId)) return invalido('ingrediente repetido na receita');
    linhas.push({ ingredienteId, quantidade });
  }
  const itemId = /^[1-9]\d*$/.test(id) ? Number(id) : undefined;
  if (itemId === undefined || !deps.existeItem(itemId)) {
    return { ok: false, tipo: 'inexistente', erro: 'item não encontrado' };
  }
  linhas.sort((a, b) => a.ingredienteId - b.ingredienteId);
  const receita: Receita = { itemId, ingredientes: [] };
  for (const { ingredienteId, quantidade } of linhas) {
    const nome = deps.nomeDoIngrediente(ingredienteId);
    if (nome === undefined) return invalido(`ingrediente ${ingredienteId} não encontrado`);
    receita.ingredientes.push({ ingredienteId, nome, quantidade });
  }
  repo.substituir(itemId, linhas);
  return { ok: true, receita };
}
