import type { DatabaseSync } from 'node:sqlite';
import type { Rota } from '../../compartilhado/http.ts';
import { criarRepositorioDoCardapio } from './repositorio.ts';
import { cadastrarItem } from './cadastrar-item/cadastrar-item.ts';
import { rotaCadastrarItem } from './cadastrar-item/rota.ts';
import { consultarItem } from './consultar-item/consultar-item.ts';
import { rotaConsultarItem } from './consultar-item/rota.ts';
import { listarItens } from './listar-itens/listar-itens.ts';
import { rotaListarItens } from './listar-itens/rota.ts';

// API pública do módulo: a única porta pela qual o resto do sistema o usa.
// É aqui que as fatias recebem o repositório.
export function moduloCardapio(banco: DatabaseSync): { rotas: Rota[] } {
  const repo = criarRepositorioDoCardapio(banco);
  return {
    rotas: [
      rotaCadastrarItem((nome, preco) => cadastrarItem(repo, nome, preco)),
      rotaListarItens(() => listarItens(repo)),
      rotaConsultarItem((id) => consultarItem(repo, id)),
    ],
  };
}
