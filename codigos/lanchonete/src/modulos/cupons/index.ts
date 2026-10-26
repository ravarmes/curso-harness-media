import type { DatabaseSync } from 'node:sqlite';
import type { Rota } from '../../compartilhado/http.ts';
import type { Cupom } from './repositorio.ts';
import { criarRepositorioDosCupons } from './repositorio.ts';
import { cadastrarCupom } from './cadastrar-cupom/cadastrar-cupom.ts';
import { rotaCadastrarCupom } from './cadastrar-cupom/rota.ts';
import { consultarCupom } from './consultar-cupom/consultar-cupom.ts';
import { rotaConsultarCupom } from './consultar-cupom/rota.ts';

// API pública do módulo: a única porta pela qual o resto do sistema o usa.
// É aqui que as fatias recebem o repositório.
export function moduloCupons(banco: DatabaseSync): {
  rotas: Rota[];
  cupomPorCodigo: (codigo: string) => Cupom | undefined;
} {
  const repo = criarRepositorioDosCupons(banco);
  return {
    cupomPorCodigo: (codigo) => {
      const resultado = consultarCupom(repo, codigo);
      return resultado.ok ? resultado.cupom : undefined;
    },
    rotas: [
      rotaCadastrarCupom((codigo, percentual) => cadastrarCupom(repo, codigo, percentual)),
      rotaConsultarCupom((codigo) => consultarCupom(repo, codigo)),
    ],
  };
}
