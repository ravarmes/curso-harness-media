import type { Nota, RepositorioDeNotas } from '../repositorio.ts';

export type ResultadoCriarNota = { ok: true; nota: Nota } | { ok: false; erro: string };

// A regra de negócio da fatia: recebe dados simples, devolve um resultado.
// Não sabe o que é HTTP; quem traduz é rota.ts.
export function criarNota(repo: Pick<RepositorioDeNotas, 'inserir'>, texto: unknown): ResultadoCriarNota {
  if (typeof texto !== 'string' || texto.trim() === '') return { ok: false, erro: 'texto obrigatório' };
  if (texto.trim().length > 280) return { ok: false, erro: 'texto com mais de 280 caracteres' };
  return { ok: true, nota: repo.inserir(texto.trim()) };
}
