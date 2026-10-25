import { falha, type Resultado } from '../../../compartilhado/resultado.ts';
import type { Profissional, RepositorioProfissionais } from '../repositorio.ts';

export function cadastrarProfissional(
  repo: RepositorioProfissionais,
  dados: unknown,
): Resultado<{ profissional: Profissional }> {
  if (typeof dados !== 'object' || dados === null) return falha('malformado', 'O corpo deve ser um objeto JSON');
  const { nome, especialidade } = dados as Record<string, unknown>;

  if (typeof nome !== 'string' || nome.trim() === '') return falha('malformado', 'O nome é obrigatório');
  if (typeof especialidade !== 'string' || especialidade.trim() === '') {
    return falha('malformado', 'A especialidade é obrigatória');
  }

  return { ok: true, profissional: repo.inserir({ nome: nome.trim(), especialidade: especialidade.trim() }) };
}
