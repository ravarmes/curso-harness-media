import type { DatabaseSync } from 'node:sqlite';
import type { Rota } from '../../compartilhado/http.ts';
import { criarRepositorioDoEstoque } from './repositorio.ts';
import { cadastrarIngrediente } from './cadastrar-ingrediente/cadastrar-ingrediente.ts';
import { rotaCadastrarIngrediente } from './cadastrar-ingrediente/rota.ts';

// API pública do módulo: a única porta pela qual o resto do sistema o usa.
// É aqui que as fatias recebem o repositório.
export function moduloEstoque(banco: DatabaseSync): { rotas: Rota[] } {
  const repo = criarRepositorioDoEstoque(banco);
  return {
    rotas: [rotaCadastrarIngrediente((nome, quantidade) => cadastrarIngrediente(repo, nome, quantidade))],
  };
}
