// Brasília não tem horário de verão desde 2019: o fuso é fixo em -03:00.
const DESLOCAMENTO_MS = 3 * 60 * 60_000;
export const MINUTO_MS = 60_000;
export const DIA_MS = 24 * 60 * MINUTO_MS;

function dataValida(ano: number, mes: number, dia: number): boolean {
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

// ISO 8601 com offset obrigatório (Z ou ±HH:MM) -> milissegundos UTC.
export function lerInstante(valor: unknown): number | undefined {
  const m =
    typeof valor === 'string'
      ? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:\d{2})$/.exec(valor)
      : null;
  if (!m) return undefined;
  const [ano, mes, dia, hora, min] = m.slice(1, 6).map(Number);
  const seg = Number(m[6] ?? 0);
  if (!dataValida(ano, mes, dia) || hora > 23 || min > 59 || seg > 59) return undefined;
  const ms = Date.parse(valor as string);
  return Number.isNaN(ms) ? undefined : ms;
}

// "2026-11-10" -> instante UTC em que esse dia começa em Brasília.
export function inicioDoDia(data: unknown): number | undefined {
  const m = typeof data === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(data) : null;
  if (!m || !dataValida(Number(m[1]), Number(m[2]), Number(m[3]))) return undefined;
  return Date.parse(`${data}T00:00:00-03:00`);
}

// Dia de Brasília que contém o instante: quando começa e o dia da semana (0 = segunda).
export function diaDe(ms: number): { inicioMs: number; diaSemana: number } {
  const dias = Math.floor((ms - DESLOCAMENTO_MS) / DIA_MS);
  // 1970-01-01 foi quinta-feira.
  return { inicioMs: dias * DIA_MS + DESLOCAMENTO_MS, diaSemana: (((dias + 3) % 7) + 7) % 7 };
}

export function paraBrasilia(ms: number): string {
  return `${new Date(ms - DESLOCAMENTO_MS).toISOString().slice(0, 19)}-03:00`;
}

// Forma em que o banco guarda o instante (UTC); ordena como texto.
export function paraUtc(ms: number): string {
  return new Date(ms).toISOString();
}
