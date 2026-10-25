// "HH:MM" em horário de Brasília <-> minutos desde 00:00. "24:00" vale para o fim do dia.
export function hhmmParaMinutos(valor: unknown): number | undefined {
  const m = typeof valor === 'string' ? /^(\d{2}):(\d{2})$/.exec(valor) : null;
  if (!m) return undefined;
  const minutos = Number(m[1]) * 60 + Number(m[2]);
  return Number(m[2]) > 59 || minutos > 24 * 60 ? undefined : minutos;
}

export function minutosParaHhmm(minutos: number): string {
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}
