import { falha, type Resultado } from '../../../compartilhado/resultado.ts';
import type { Paciente, RepositorioPacientes } from '../repositorio.ts';

const TELEFONE_INTERNACIONAL = /^\+\d{10,15}$/;

export function cadastrarPaciente(repo: RepositorioPacientes, dados: unknown): Resultado<{ paciente: Paciente }> {
  if (typeof dados !== 'object' || dados === null) return falha('malformado', 'O corpo deve ser um objeto JSON');
  const { nome, telefone, email } = dados as Record<string, unknown>;

  if (typeof nome !== 'string' || nome.trim() === '') return falha('malformado', 'O nome é obrigatório');
  if (typeof telefone !== 'string') return falha('malformado', 'O telefone é obrigatório');
  const telefoneLimpo = telefone.replace(/[\s\-()]/g, '');
  if (!TELEFONE_INTERNACIONAL.test(telefoneLimpo)) {
    return falha('malformado', 'O telefone deve estar no formato internacional, ex.: +5511999998888');
  }
  if (email !== undefined && email !== null && typeof email !== 'string') {
    return falha('malformado', 'O e-mail deve ser um texto');
  }

  return { ok: true, paciente: repo.inserir({ nome: nome.trim(), telefone: telefoneLimpo, email: email ?? null }) };
}
