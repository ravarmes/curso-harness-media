import type { Ingrediente, RepositorioDoEstoque } from '../repositorio.ts';

export type ResultadoCadastrarIngrediente =
  { ok: true; ingrediente: Ingrediente } | { ok: false; tipo: 'invalido' | 'duplicado'; erro: string };

// A regra de negócio da fatia: recebe dados simples, devolve um resultado.
// Não sabe o que é HTTP; quem traduz é rota.ts.
export function cadastrarIngrediente(
  repo: Pick<RepositorioDoEstoque, 'existeNome' | 'inserir'>,
  nome: unknown,
  quantidade: unknown,
): ResultadoCadastrarIngrediente {
  if (typeof nome !== 'string' || nome.trim() === '') return { ok: false, tipo: 'invalido', erro: 'nome obrigatório' };
  const nomeAparado = nome.trim();
  if (nomeAparado.length > 80) return { ok: false, tipo: 'invalido', erro: 'nome com mais de 80 caracteres' };
  if (typeof quantidade !== 'number' || !Number.isInteger(quantidade) || quantidade < 0) {
    return { ok: false, tipo: 'invalido', erro: 'quantidade deve ser um inteiro maior ou igual a zero' };
  }
  if (repo.existeNome(nomeAparado)) {
    return { ok: false, tipo: 'duplicado', erro: 'já existe um ingrediente com esse nome' };
  }
  return { ok: true, ingrediente: repo.inserir(nomeAparado, quantidade) };
}
