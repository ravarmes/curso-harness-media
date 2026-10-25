import { abrirBanco } from './compartilhado/banco.ts';
import { criarServidor } from './compartilhado/http.ts';
import { agenda } from './modulos/agenda/index.ts';
import { pacientes } from './modulos/pacientes/index.ts';
import { profissionais } from './modulos/profissionais/index.ts';

// Composição: todo módulo novo é registrado aqui, e só aqui, com as suas
// rotas: criarServidor([...moduloX(banco).rotas]).
export function criarApp(banco = abrirBanco()) {
  const modPacientes = pacientes(banco);
  const modProfissionais = profissionais(banco);
  const modAgenda = agenda(banco, { pacientes: modPacientes, profissionais: modProfissionais });
  return criarServidor([...modPacientes.rotas, ...modProfissionais.rotas, ...modAgenda.rotas]);
}
