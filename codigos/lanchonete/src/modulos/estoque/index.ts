import type { DatabaseSync } from 'node:sqlite';
import type { Rota } from '../../compartilhado/http.ts';
import { criarRepositorioDoEstoque } from './repositorio.ts';
import { cadastrarIngrediente } from './cadastrar-ingrediente/cadastrar-ingrediente.ts';
import { rotaCadastrarIngrediente } from './cadastrar-ingrediente/rota.ts';
import { consultarIngrediente } from './consultar-ingrediente/consultar-ingrediente.ts';
import { rotaConsultarIngrediente } from './consultar-ingrediente/rota.ts';
import { listarEstoque } from './listar-estoque/listar-estoque.ts';
import { rotaListarEstoque } from './listar-estoque/rota.ts';
import { reporIngrediente } from './repor-ingrediente/repor-ingrediente.ts';
import { rotaReporIngrediente } from './repor-ingrediente/rota.ts';

// API pública do módulo: a única porta pela qual o resto do sistema o usa.
// É aqui que as fatias recebem o repositório.
export function moduloEstoque(banco: DatabaseSync): { rotas: Rota[] } {
  const repo = criarRepositorioDoEstoque(banco);
  return {
    rotas: [
      rotaCadastrarIngrediente((nome, quantidade) => cadastrarIngrediente(repo, nome, quantidade)),
      rotaReporIngrediente((id, quantidade) => reporIngrediente(repo, id, quantidade)),
      rotaListarEstoque(() => listarEstoque(repo)),
      rotaConsultarIngrediente((id) => consultarIngrediente(repo, id)),
    ],
  };
}
