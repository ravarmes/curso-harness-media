import type { Bairro, RepositorioDosBairros } from '../repositorio.ts';

export type ResultadoCadastrarBairro =
  { ok: true; bairro: Bairro } | { ok: false; tipo: 'invalido' | 'duplicado'; erro: string };

// A regra de negócio da fatia: recebe dados simples, devolve um resultado.
// Não sabe o que é HTTP; quem traduz é rota.ts.
export function cadastrarBairro(
  repo: Pick<RepositorioDosBairros, 'existeNome' | 'inserir'>,
  nome: unknown,
  taxa: unknown,
): ResultadoCadastrarBairro {
  if (typeof nome !== 'string' || nome.trim() === '') return { ok: false, tipo: 'invalido', erro: 'nome obrigatório' };
  const nomeAparado = nome.trim();
  if (nomeAparado.length > 80) return { ok: false, tipo: 'invalido', erro: 'nome com mais de 80 caracteres' };
  if (typeof taxa !== 'number' || !Number.isInteger(taxa) || taxa < 0) {
    return { ok: false, tipo: 'invalido', erro: 'taxa deve ser um inteiro maior ou igual a zero, em centavos' };
  }
  if (repo.existeNome(nomeAparado)) return { ok: false, tipo: 'duplicado', erro: 'já existe um bairro com esse nome' };
  return { ok: true, bairro: repo.inserir(nomeAparado, taxa) };
}
