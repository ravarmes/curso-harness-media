import type { Rota } from '../../../compartilhado/http.ts';
import { listarPacientes } from './listar-pacientes.ts';

export function rotaListarPacientes(repo: Parameters<typeof listarPacientes>[0]): Rota {
  return {
    metodo: 'GET',
    caminho: '/pacientes',
    manipulador: () => ({ status: 200, corpo: listarPacientes(repo).pacientes }),
  };
}
