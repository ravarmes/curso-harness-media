import type { ItemDoCardapio, RepositorioDoCardapio } from '../repositorio.ts';

export type ResultadoCadastrarItem =
  { ok: true; item: ItemDoCardapio } | { ok: false; tipo: 'invalido' | 'duplicado'; erro: string };

// A regra de negócio da fatia: recebe dados simples, devolve um resultado.
// Não sabe o que é HTTP; quem traduz é rota.ts.
export function cadastrarItem(
  repo: Pick<RepositorioDoCardapio, 'existeNome' | 'inserir'>,
  nome: unknown,
  preco: unknown,
): ResultadoCadastrarItem {
  if (typeof nome !== 'string' || nome.trim() === '') return { ok: false, tipo: 'invalido', erro: 'nome obrigatório' };
  const nomeAparado = nome.trim();
  if (nomeAparado.length > 80) return { ok: false, tipo: 'invalido', erro: 'nome com mais de 80 caracteres' };
  if (typeof preco !== 'number' || !Number.isInteger(preco) || preco <= 0) {
    return { ok: false, tipo: 'invalido', erro: 'preço deve ser um inteiro positivo, em centavos' };
  }
  if (repo.existeNome(nomeAparado)) return { ok: false, tipo: 'duplicado', erro: 'já existe um item com esse nome' };
  return { ok: true, item: repo.inserir(nomeAparado, preco) };
}
