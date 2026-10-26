import type { DatabaseSync } from 'node:sqlite';
import { criarRepositorioEspera } from './repositorio.ts';
import type { Contexto } from './entrar-na-lista/entrar-na-lista.ts';
import { rotaEntrarNaLista } from './entrar-na-lista/rota.ts';
import { rotaSairDaLista } from './sair-da-lista/rota.ts';

// A lista de espera pergunta a pacientes e profissionais pelo index.ts deles.
export function espera(
  banco: DatabaseSync,
  outros: {
    pacientes: { existe: (id: number) => boolean };
    profissionais: { existe: (id: number) => boolean };
  },
) {
  const ctx: Contexto = {
    repo: criarRepositorioEspera(banco),
    agora: Date.now,
    pacienteExiste: outros.pacientes.existe,
    profissionalExiste: outros.profissionais.existe,
  };
  return {
    rotas: [rotaEntrarNaLista(ctx), rotaSairDaLista(ctx)],
  };
}
