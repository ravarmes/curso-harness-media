import type { DatabaseSync } from 'node:sqlite';
import { criarRepositorioLembretes } from './repositorio.ts';
import { criarEnviadorWhatsApp } from './provedor-whatsapp.ts';
import type { Contexto } from './enviar-lembretes-da-vespera/enviar-lembretes-da-vespera.ts';
import { rotaEnviarLembretesDaVespera } from './enviar-lembretes-da-vespera/rota.ts';

// Lembretes pergunta a agenda, a pacientes e a profissionais pelo index.ts deles.
export function lembretes(
  banco: DatabaseSync,
  outros: {
    agenda: { consultasDaVespera: Contexto['consultasDaVespera'] };
    pacientes: { contato: Contexto['contatoDe'] };
    profissionais: { nome: Contexto['nomeDoProfissional'] };
  },
  env: Record<string, string | undefined> = process.env,
) {
  const ctx: Contexto = {
    repo: criarRepositorioLembretes(banco),
    agora: Date.now,
    consultasDaVespera: outros.agenda.consultasDaVespera,
    contatoDe: outros.pacientes.contato,
    nomeDoProfissional: outros.profissionais.nome,
    enviar: criarEnviadorWhatsApp(env),
  };
  return { rotas: [rotaEnviarLembretesDaVespera(ctx)] };
}
