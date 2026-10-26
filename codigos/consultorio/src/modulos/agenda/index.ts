import type { DatabaseSync } from 'node:sqlite';
import { criarRepositorioAgenda } from './repositorio.ts';
import type { Contexto } from './agendar-consulta/agendar-consulta.ts';
import { rotaAgendarConsulta } from './agendar-consulta/rota.ts';
import { rotaCancelarConsulta } from './cancelar-consulta/rota.ts';
import { rotaRemarcarConsulta } from './remarcar-consulta/rota.ts';
import { rotaRegistrarFalta } from './registrar-falta/rota.ts';
import { rotaObterAgendaDoDia } from './obter-agenda-do-dia/rota.ts';
import { rotaListarHorariosLivres } from './listar-horarios-livres/rota.ts';
import { consultasDaVespera } from './consultas-da-vespera/consultas-da-vespera.ts';

// A agenda pergunta a pacientes e profissionais pelo index.ts deles.
export function agenda(
  banco: DatabaseSync,
  outros: {
    pacientes: { existe: (id: number) => boolean };
    profissionais: { existe: (id: number) => boolean; expediente: Contexto['expedienteDe'] };
  },
) {
  const ctx: Contexto = {
    repo: criarRepositorioAgenda(banco),
    agora: Date.now,
    pacienteExiste: outros.pacientes.existe,
    profissionalExiste: outros.profissionais.existe,
    expedienteDe: outros.profissionais.expediente,
  };
  return {
    rotas: [
      rotaAgendarConsulta(ctx),
      rotaCancelarConsulta(ctx),
      rotaRemarcarConsulta(ctx),
      rotaRegistrarFalta(ctx),
      rotaObterAgendaDoDia(ctx),
      rotaListarHorariosLivres(ctx),
    ],
    // Para os outros módulos (ex.: lembretes): consultas agendadas que começam no dia seguinte ao de `agoraMs`.
    consultasDaVespera: (agoraMs: number) => consultasDaVespera(ctx, agoraMs),
  };
}
