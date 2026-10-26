import type { DatabaseSync } from 'node:sqlite';
import type { Rota } from '../../compartilhado/http.ts';
import type { Cupom } from './repositorio.ts';
import { criarRepositorioDosCupons } from './repositorio.ts';
import { cadastrarCupom } from './cadastrar-cupom/cadastrar-cupom.ts';
import { rotaCadastrarCupom } from './cadastrar-cupom/rota.ts';

// API pública do módulo: a única porta pela qual o resto do sistema o usa.
// É aqui que as fatias recebem o repositório.
export function moduloCupons(banco: DatabaseSync): {
  rotas: Rota[];
  cupomPorCodigo: (codigo: string) => Cupom | undefined;
} {
  const repo = criarRepositorioDosCupons(banco);
  return {
    cupomPorCodigo: (codigo) => repo.buscarPorCodigo(codigo.trim().toUpperCase()),
    rotas: [rotaCadastrarCupom((codigo, percentual) => cadastrarCupom(repo, codigo, percentual))],
  };
}
