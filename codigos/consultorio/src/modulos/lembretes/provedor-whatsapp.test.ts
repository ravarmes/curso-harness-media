import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { criarEnviadorWhatsApp } from './provedor-whatsapp.ts';

async function comProvedor(
  status: number,
  usar: (url: string, recebidos: { auth?: string; corpo: string }[]) => Promise<void>,
) {
  const recebidos: { auth?: string; corpo: string }[] = [];
  const servidor = createServer(async (req, res) => {
    let corpo = '';
    for await (const parte of req) corpo += parte;
    recebidos.push({ auth: req.headers.authorization, corpo });
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end('{}');
  });
  await new Promise<void>((ok) => servidor.listen(0, '127.0.0.1', ok));
  try {
    await usar(`http://127.0.0.1:${(servidor.address() as AddressInfo).port}`, recebidos);
  } finally {
    servidor.close();
  }
}

test('sem URL ou token não há enviador', () => {
  assert.equal(criarEnviadorWhatsApp({ WHATSAPP_TOKEN: 't' }), undefined);
  assert.equal(criarEnviadorWhatsApp({ WHATSAPP_URL: 'http://x' }), undefined);
});

test('envia POST /mensagens com o token e o corpo { para, texto }', async () => {
  await comProvedor(200, async (url, recebidos) => {
    const enviar = criarEnviadorWhatsApp({ WHATSAPP_URL: url, WHATSAPP_TOKEN: 'segredo' });
    assert.ok(enviar);
    await enviar('5511999990000', 'oi');
    assert.deepEqual(recebidos, [
      { auth: 'Bearer segredo', corpo: JSON.stringify({ para: '5511999990000', texto: 'oi' }) },
    ]);
  });
});

test('resposta que não é 2xx vira erro', async () => {
  await comProvedor(401, async (url) => {
    const enviar = criarEnviadorWhatsApp({ WHATSAPP_URL: url, WHATSAPP_TOKEN: 'errado' });
    assert.ok(enviar);
    await assert.rejects(enviar('1', 'oi'), /401/);
  });
});
