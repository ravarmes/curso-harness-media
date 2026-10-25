export type EnviarMensagem = (para: string, texto: string) => Promise<void>;

// Sem WHATSAPP_URL e WHATSAPP_TOKEN não há como enviar: devolve undefined.
export function criarEnviadorWhatsApp(env: Record<string, string | undefined>): EnviarMensagem | undefined {
  const url = env.WHATSAPP_URL;
  const token = env.WHATSAPP_TOKEN;
  if (!url || !token) return undefined;
  return async (para, texto) => {
    const resposta = await fetch(`${url.replace(/\/+$/, '')}/mensagens`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ para, texto }),
    });
    if (!resposta.ok) throw new Error(`provedor respondeu ${resposta.status}`);
  };
}
