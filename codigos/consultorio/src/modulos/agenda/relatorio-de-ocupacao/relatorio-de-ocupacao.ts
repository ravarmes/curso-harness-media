import { falha, type Resultado } from '../../../compartilhado/resultado.ts';
import type { Contexto } from '../agendar-consulta/agendar-consulta.ts';
import { DIA_MS, diaDe, inicioDoDia, MINUTO_MS, paraUtc } from '../tempo.ts';

export type ContextoRelatorio = Contexto & {
  listarProfissionais: () => { id: number; nome: string }[];
};

export type OcupacaoDoProfissional = {
  profissional_id: number;
  nome: string;
  horas_expediente: number;
  horas_ocupadas: number;
  percentual_ocupacao: number;
};

export type RelatorioDeOcupacao = { de: string; ate: string; profissionais: OcupacaoDoProfissional[] };

const MAXIMO_DE_DIAS = 92;
const HORA_MS = 60 * MINUTO_MS;

const arredondar = (valor: number, casas: number) => Math.round(valor * 10 ** casas) / 10 ** casas;

// Minutos de expediente num dia da semana; faixas encostadas ou sobrepostas valem como uma só.
function minutosDeExpedienteNoDia(faixas: ReturnType<Contexto['expedienteDe']>, diaSemana: number): number {
  let total = 0;
  let fimAnterior = -1;
  for (const f of faixas.filter((x) => x.dia_semana === diaSemana).sort((a, b) => a.inicio_min - b.inicio_min)) {
    const inicio = Math.max(f.inicio_min, fimAnterior);
    if (f.fim_min > inicio) total += f.fim_min - inicio;
    fimAnterior = Math.max(fimAnterior, f.fim_min);
  }
  return total;
}

// `de` e `ate` são dias de Brasília (AAAA-MM-DD), ambos inclusos.
export function relatorioDeOcupacao(
  ctx: ContextoRelatorio,
  de: string,
  ate: string,
): Resultado<{ relatorio: RelatorioDeOcupacao }> {
  const inicio = inicioDoDia(de);
  const inicioDoUltimo = inicioDoDia(ate);
  if (inicio === undefined || inicioDoUltimo === undefined) {
    return falha('malformado', 'As datas devem estar no formato AAAA-MM-DD');
  }
  if (inicioDoUltimo < inicio) return falha('recusado', 'A data final não pode ser anterior à inicial');
  const dias = Math.round((inicioDoUltimo - inicio) / DIA_MS) + 1;
  if (dias > MAXIMO_DE_DIAS) return falha('recusado', `O período deve ter no máximo ${MAXIMO_DE_DIAS} dias`);

  const deUtc = paraUtc(inicio);
  const ateUtc = paraUtc(inicioDoUltimo + DIA_MS);
  const diasDaSemana = Array.from({ length: dias }, (_, i) => diaDe(inicio + i * DIA_MS).diaSemana);

  const profissionais = ctx.listarProfissionais().map((p) => {
    const faixas = ctx.expedienteDe(p.id);
    const minutosDeExpediente = diasDaSemana.reduce((soma, d) => soma + minutosDeExpedienteNoDia(faixas, d), 0);
    const msOcupados = ctx.repo
      .ocupadasDoProfissionalNoPeriodo(p.id, deUtc, ateUtc)
      .reduce((soma, c) => soma + (Date.parse(c.fim_utc) - Date.parse(c.inicio_utc)), 0);
    const horasExpediente = minutosDeExpediente / 60;
    const horasOcupadas = msOcupados / HORA_MS;
    return {
      profissional_id: p.id,
      nome: p.nome,
      horas_expediente: arredondar(horasExpediente, 2),
      horas_ocupadas: arredondar(horasOcupadas, 2),
      percentual_ocupacao: horasExpediente === 0 ? 0 : arredondar((horasOcupadas / horasExpediente) * 100, 1),
    };
  });
  return { ok: true, relatorio: { de, ate, profissionais } };
}
