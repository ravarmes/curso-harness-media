import type { DatabaseSync } from 'node:sqlite';
import type { Rota } from '../../compartilhado/http.ts';
import type { Dependencias } from './dependencias.ts';
import { criarRepositorioDePedidos } from './repositorio.ts';
import { criarPedido } from './criar-pedido/criar-pedido.ts';
import { rotaCriarPedido } from './criar-pedido/rota.ts';

// API pública do módulo: a única porta pela qual o resto do sistema o usa.
// É aqui que as fatias recebem o repositório e as respostas dos outros módulos.
export function moduloPedidos(banco: DatabaseSync, deps: Dependencias): { rotas: Rota[] } {
  const repo = criarRepositorioDePedidos(banco);
  return {
    rotas: [rotaCriarPedido((corpo) => criarPedido(repo, deps, corpo))],
  };
}
