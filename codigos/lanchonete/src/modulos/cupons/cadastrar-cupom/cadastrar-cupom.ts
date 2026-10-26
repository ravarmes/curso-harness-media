import type { Cupom, RepositorioDosCupons } from '../repositorio.ts';

export type ResultadoCadastrarCupom =
  { ok: true; cupom: Cupom } | { ok: false; tipo: 'invalido' | 'duplicado'; erro: string };

// A regra de negócio da fatia: recebe dados simples, devolve um resultado.
// Não sabe o que é HTTP; quem traduz é rota.ts.
export function cadastrarCupom(
  repo: Pick<RepositorioDosCupons, 'existeCodigo' | 'inserir'>,
  codigo: unknown,
  percentual: unknown,
): ResultadoCadastrarCupom {
  if (typeof codigo !== 'string' || codigo.trim() === '') {
    return { ok: false, tipo: 'invalido', erro: 'código obrigatório' };
  }
  const codigoAparado = codigo.trim();
  if (codigoAparado.length > 30) return { ok: false, tipo: 'invalido', erro: 'código com mais de 30 caracteres' };
  if (!/^[A-Za-z0-9-]+$/.test(codigoAparado)) {
    return { ok: false, tipo: 'invalido', erro: 'código aceita só letras, números e hífen' };
  }
  if (typeof percentual !== 'number' || !Number.isInteger(percentual) || percentual < 1 || percentual > 100) {
    return { ok: false, tipo: 'invalido', erro: 'percentual deve ser um inteiro de 1 a 100' };
  }
  const codigoNormalizado = codigoAparado.toUpperCase();
  if (repo.existeCodigo(codigoNormalizado)) {
    return { ok: false, tipo: 'duplicado', erro: 'já existe um cupom com esse código' };
  }
  return { ok: true, cupom: repo.inserir(codigoNormalizado, percentual) };
}
