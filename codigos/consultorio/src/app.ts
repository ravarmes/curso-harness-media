import { abrirBanco } from './compartilhado/banco.ts';
import { criarServidor } from './compartilhado/http.ts';
import { pacientes } from './modulos/pacientes/index.ts';
import { profissionais } from './modulos/profissionais/index.ts';

// Composição: todo módulo novo é registrado aqui, e só aqui, com as suas
// rotas: criarServidor([...moduloX(banco).rotas]).
export function criarApp(banco = abrirBanco()) {
  return criarServidor([...pacientes(banco).rotas, ...profissionais(banco).rotas]);
}
