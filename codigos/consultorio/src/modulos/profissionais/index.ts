import type { DatabaseSync } from 'node:sqlite';
import { criarRepositorioProfissionais } from './repositorio.ts';
import { rotaCadastrarProfissional } from './cadastrar-profissional/rota.ts';
import { rotaListarProfissionais } from './listar-profissionais/rota.ts';
import { rotaObterProfissional } from './obter-profissional/rota.ts';
import { rotaObterExpediente } from './obter-expediente/rota.ts';
import { rotaDefinirExpediente } from './definir-expediente/rota.ts';

export function profissionais(banco: DatabaseSync) {
  const repo = criarRepositorioProfissionais(banco);
  return {
    rotas: [
      rotaCadastrarProfissional(repo),
      rotaListarProfissionais(repo),
      rotaObterProfissional(repo),
      rotaObterExpediente(repo),
      rotaDefinirExpediente(repo),
    ],
    // Para os outros módulos (ex.: agenda) perguntarem se o profissional existe.
    existe: (id: number) => repo.buscar(id) !== undefined,
    nome: (id: number) => repo.buscar(id)?.nome,
    // Faixas em minutos desde 00:00 de Brasília; dia_semana 0 = segunda.
    expediente: (id: number) => repo.expediente(id),
  };
}
