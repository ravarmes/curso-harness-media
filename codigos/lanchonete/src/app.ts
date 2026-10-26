import { abrirBanco } from './compartilhado/banco.ts';
import { criarServidor } from './compartilhado/http.ts';
import { moduloCardapio } from './modulos/cardapio/index.ts';
import { moduloNotas } from './modulos/notas/index.ts';

// Composição: todo módulo novo é registrado aqui, e só aqui.
export function criarApp(banco = abrirBanco()) {
  return criarServidor([...moduloNotas(banco).rotas, ...moduloCardapio(banco).rotas]);
}
