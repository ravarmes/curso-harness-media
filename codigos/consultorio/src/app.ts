import { abrirBanco } from './compartilhado/banco.ts';
import { criarServidor } from './compartilhado/http.ts';

// Composição: todo módulo novo é registrado aqui, e só aqui, com as suas
// rotas: criarServidor([...moduloX(banco).rotas]).
export function criarApp(banco = abrirBanco()) {
  return criarServidor([]);
}
