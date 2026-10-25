import type { DatabaseSync } from 'node:sqlite';
import type { Rota } from '../../compartilhado/http.ts';
import { criarRepositorioDeNotas } from './repositorio.ts';
import { criarNota } from './criar-nota/criar-nota.ts';
import { rotaCriarNota } from './criar-nota/rota.ts';
import { listarNotas } from './listar-notas/listar-notas.ts';
import { rotaListarNotas } from './listar-notas/rota.ts';

// API pública do módulo: a única porta pela qual o resto do sistema o usa.
// É aqui que as fatias recebem o repositório.
export function moduloNotas(banco: DatabaseSync): { rotas: Rota[] } {
  const repo = criarRepositorioDeNotas(banco);
  return {
    rotas: [rotaCriarNota((texto) => criarNota(repo, texto)), rotaListarNotas(() => listarNotas(repo))],
  };
}
