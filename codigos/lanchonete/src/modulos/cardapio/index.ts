import type { DatabaseSync } from 'node:sqlite';
import type { Rota } from '../../compartilhado/http.ts';
import { criarRepositorioDoCardapio } from './repositorio.ts';
import { cadastrarItem } from './cadastrar-item/cadastrar-item.ts';
import { rotaCadastrarItem } from './cadastrar-item/rota.ts';

// API pública do módulo: a única porta pela qual o resto do sistema o usa.
// É aqui que as fatias recebem o repositório.
export function moduloCardapio(banco: DatabaseSync): { rotas: Rota[] } {
  const repo = criarRepositorioDoCardapio(banco);
  return {
    rotas: [rotaCadastrarItem((nome, preco) => cadastrarItem(repo, nome, preco))],
  };
}
