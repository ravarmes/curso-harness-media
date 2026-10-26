import type { Dependencias, Receita } from '../dependencias.ts';
import type { RepositorioDeReceitas } from '../repositorio.ts';

export type ResultadoConsultarReceita = { ok: true; receita: Receita } | { ok: false; erro: string };

// O id chega como texto da URL; o que não for inteiro positivo não existe.
// O nome do ingrediente é lido do estoque agora, não gravado na receita.
export function consultarReceita(
  repo: Pick<RepositorioDeReceitas, 'listar'>,
  deps: Dependencias,
  id: string,
): ResultadoConsultarReceita {
  const itemId = /^[1-9]\d*$/.test(id) ? Number(id) : undefined;
  if (itemId === undefined || !deps.existeItem(itemId)) return { ok: false, erro: 'item não encontrado' };
  const ingredientes = repo.listar(itemId).map(({ ingredienteId, quantidade }) => ({
    ingredienteId,
    nome: deps.nomeDoIngrediente(ingredienteId) ?? `ingrediente ${ingredienteId}`,
    quantidade,
  }));
  return { ok: true, receita: { itemId, ingredientes } };
}
