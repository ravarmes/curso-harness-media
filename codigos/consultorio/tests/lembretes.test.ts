// Ponta a ponta do lembrete: códigos e corpos HTTP, com o banco em memória.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { DatabaseSync } from 'node:sqlite';
import { criarApp } from '../src/app.ts';

async function subir(env: Record<string, string>) {
  const servidor = criarApp(new DatabaseSync(':memory:'), env);
  await new Promise<void>((pronto) => servidor.listen(0, pronto));
  return { servidor, base: `http://localhost:${(servidor.address() as AddressInfo).port}` };
}

const configurado = await subir({ WHATSAPP_URL: 'http://127.0.0.1:1', WHATSAPP_TOKEN: 't' });
const semProvedor = await subir({});
after(() => {
  configurado.servidor.close();
  semProvedor.servidor.close();
});

test('sem consultas amanhã responde 200 com tudo zero', async () => {
  const res = await fetch(`${configurado.base}/lembretes/enviar-da-vespera`, { method: 'POST' });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { enviados: 0, falhas: 0, jaEnviados: 0 });
});

test('sem WHATSAPP_URL e WHATSAPP_TOKEN responde 409', async () => {
  const res = await fetch(`${semProvedor.base}/lembretes/enviar-da-vespera`, { method: 'POST' });
  assert.equal(res.status, 409);
  assert.deepEqual(await res.json(), { erro: 'provedor de WhatsApp não configurado' });
});

test('outro método que não POST responde 404', async () => {
  const res = await fetch(`${configurado.base}/lembretes/enviar-da-vespera`);
  assert.equal(res.status, 404);
  assert.ok(typeof ((await res.json()) as { erro: string }).erro === 'string');
});
