import type { Rota } from '../../../compartilhado/http.ts';
import { listarProfissionais } from './listar-profissionais.ts';

export function rotaListarProfissionais(repo: Parameters<typeof listarProfissionais>[0]): Rota {
  return {
    metodo: 'GET',
    caminho: '/profissionais',
    manipulador: () => ({ status: 200, corpo: listarProfissionais(repo).profissionais }),
  };
}
