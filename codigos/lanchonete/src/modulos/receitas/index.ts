import type { DatabaseSync } from 'node:sqlite';
import type { Rota } from '../../compartilhado/http.ts';
import type { Dependencias } from './dependencias.ts';
import { criarRepositorioDeReceitas } from './repositorio.ts';
import { consultarReceita } from './consultar-receita/consultar-receita.ts';
import { rotaConsultarReceita } from './consultar-receita/rota.ts';
import { definirReceita } from './definir-receita/definir-receita.ts';
import { rotaDefinirReceita } from './definir-receita/rota.ts';

// API pública do módulo: a única porta pela qual o resto do sistema o usa.
// É aqui que as fatias recebem o repositório e as respostas dos outros módulos.
export function moduloReceitas(banco: DatabaseSync, deps: Dependencias): { rotas: Rota[] } {
  const repo = criarRepositorioDeReceitas(banco);
  return {
    rotas: [
      rotaDefinirReceita((id, ingredientes) => definirReceita(repo, deps, id, ingredientes)),
      rotaConsultarReceita((id) => consultarReceita(repo, deps, id)),
    ],
  };
}
