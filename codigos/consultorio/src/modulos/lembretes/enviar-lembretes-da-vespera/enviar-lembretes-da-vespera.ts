import { falha, type Resultado } from '../../../compartilhado/resultado.ts';
import type { EnviarMensagem } from '../provedor-whatsapp.ts';
import type { RepositorioLembretes } from '../repositorio.ts';

export type Contexto = {
  repo: RepositorioLembretes;
  agora: () => number;
  consultasDaVespera: (
    agoraMs: number,
  ) => { id: number; paciente_id: number; profissional_id: number; inicio: string }[];
  contatoDe: (pacienteId: number) => { nome: string; telefone: string } | undefined;
  nomeDoProfissional: (id: number) => string | undefined;
  enviar: EnviarMensagem | undefined;
};

export type ResumoDoEnvio = { enviados: number; falhas: number; jaEnviados: number };

// `inicio` vem de Brasília: 2026-11-10T14:00:00-03:00 -> "10/11" e "14:00".
function texto(nome: string, profissional: string, inicio: string): string {
  const [, mes, dia] = /^\d{4}-(\d{2})-(\d{2})/.exec(inicio) ?? [];
  return `Olá, ${nome}! Lembrete: você tem consulta amanhã, ${dia}/${mes} às ${inicio.slice(11, 16)}, com ${profissional}.`;
}

// Chamada por um cron externo. Cada consulta é tentada uma vez por chamada; as
// já enviadas são puladas, então chamar de novo só reenvia o que falhou.
export async function enviarLembretesDaVespera(ctx: Contexto): Promise<Resultado<ResumoDoEnvio>> {
  const enviar = ctx.enviar;
  if (!enviar) return falha('recusado', 'provedor de WhatsApp não configurado');

  const resumo: ResumoDoEnvio = { enviados: 0, falhas: 0, jaEnviados: 0 };
  for (const consulta of ctx.consultasDaVespera(ctx.agora())) {
    if (ctx.repo.status(consulta.id) === 'enviado') {
      resumo.jaEnviados++;
      continue;
    }
    const paciente = ctx.contatoDe(consulta.paciente_id);
    const profissional = ctx.nomeDoProfissional(consulta.profissional_id);
    let enviado = false;
    if (paciente && profissional) {
      try {
        await enviar(paciente.telefone, texto(paciente.nome, profissional, consulta.inicio));
        enviado = true;
      } catch {
        // Falha do provedor: registrada abaixo, tentada de novo na próxima chamada.
      }
    }
    ctx.repo.registrar(consulta.id, enviado ? 'enviado' : 'falhou', ctx.agora());
    if (enviado) resumo.enviados++;
    else resumo.falhas++;
  }
  return { ok: true, ...resumo };
}
