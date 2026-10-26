import type { DatabaseSync } from 'node:sqlite';
import type { Rota } from '../../compartilhado/http.ts';
import { criarRepositorioDosBairros } from './repositorio.ts';
import { cadastrarBairro } from './cadastrar-bairro/cadastrar-bairro.ts';
import { rotaCadastrarBairro } from './cadastrar-bairro/rota.ts';
import { consultarBairro } from './consultar-bairro/consultar-bairro.ts';
import { rotaConsultarBairro } from './consultar-bairro/rota.ts';
import { listarBairros } from './listar-bairros/listar-bairros.ts';
import { rotaListarBairros } from './listar-bairros/rota.ts';

// API pública do módulo: a única porta pela qual o resto do sistema o usa.
// É aqui que as fatias recebem o repositório.
export function moduloBairros(banco: DatabaseSync): {
  rotas: Rota[];
  taxaDoBairro: (id: number) => number | undefined;
} {
  const repo = criarRepositorioDosBairros(banco);
  return {
    taxaDoBairro: (id) => repo.buscarPorId(id)?.taxa,
    rotas: [
      rotaCadastrarBairro((nome, taxa) => cadastrarBairro(repo, nome, taxa)),
      rotaListarBairros(() => listarBairros(repo)),
      rotaConsultarBairro((id) => consultarBairro(repo, id)),
    ],
  };
}
