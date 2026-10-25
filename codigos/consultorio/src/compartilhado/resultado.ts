// Resultado das regras de negócio. Não conhece HTTP: quem traduz o tipo do
// erro para um código é a rota (ver respostaDeErro em http.ts).
export type Erro = { tipo: 'malformado' | 'inexistente' | 'recusado'; mensagem: string };
export type Resultado<T> = ({ ok: true } & T) | { ok: false; erro: Erro };

export function falha(tipo: Erro['tipo'], mensagem: string): { ok: false; erro: Erro } {
  return { ok: false, erro: { tipo, mensagem } };
}

// Id vindo da URL: só inteiros positivos.
export function lerId(texto: string): number | undefined {
  return /^\d+$/.test(texto) ? Number(texto) : undefined;
}
