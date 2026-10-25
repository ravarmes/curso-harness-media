import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { criarRepositorioLembretes } from '../repositorio.ts';
import { enviarLembretesDaVespera, type Contexto } from './enviar-lembretes-da-vespera.ts';

type Consulta = { id: number; paciente_id: number; profissional_id: number; inicio: string };

function novoCenario(consultas: Consulta[]) {
  const enviadas: { para: string; texto: string }[] = [];
  const estado = { falhar: new Set<string>(), canceladas: new Set<number>() };
  const ctx: Contexto = {
    repo: criarRepositorioLembretes(new DatabaseSync(':memory:')),
    agora: () => Date.parse('2026-11-09T10:00:00-03:00'),
    consultasDaVespera: () => consultas.filter((c) => !estado.canceladas.has(c.id)),
    contatoDe: (id) =>
      ({ 1: { nome: 'Ana', telefone: '5511999990000' }, 2: { nome: 'Bia', telefone: '5511888880000' } })[id],
    nomeDoProfissional: (id) => (id === 1 ? 'Dr. Caio' : undefined),
    enviar: async (para, texto) => {
      if (estado.falhar.has(para)) throw new Error('provedor respondeu 503');
      enviadas.push({ para, texto });
    },
  };
  return { ctx, enviadas, estado };
}

const consulta1: Consulta = { id: 1, paciente_id: 1, profissional_id: 1, inicio: '2026-11-10T14:00:00-03:00' };
const consulta2: Consulta = { id: 2, paciente_id: 2, profissional_id: 1, inicio: '2026-11-10T23:30:00-03:00' };

test('envia a mensagem ao telefone do paciente com data, hora de Brasília e profissional', async () => {
  const { ctx, enviadas } = novoCenario([consulta1]);
  assert.deepEqual(await enviarLembretesDaVespera(ctx), { ok: true, enviados: 1, falhas: 0, jaEnviados: 0 });
  assert.deepEqual(enviadas, [
    {
      para: '5511999990000',
      texto: 'Olá, Ana! Lembrete: você tem consulta amanhã, 10/11 às 14:00, com Dr. Caio.',
    },
  ]);
});

test('sem consultas amanhã devolve tudo zero e não envia nada', async () => {
  const { ctx, enviadas } = novoCenario([]);
  assert.deepEqual(await enviarLembretesDaVespera(ctx), { ok: true, enviados: 0, falhas: 0, jaEnviados: 0 });
  assert.deepEqual(enviadas, []);
});

test('chamar de novo não reenvia: a segunda vez conta como já enviado', async () => {
  const { ctx, enviadas } = novoCenario([consulta1]);
  await enviarLembretesDaVespera(ctx);
  assert.deepEqual(await enviarLembretesDaVespera(ctx), { ok: true, enviados: 0, falhas: 0, jaEnviados: 1 });
  assert.equal(enviadas.length, 1);
});

test('falha do provedor numa consulta não para as outras e só ela é reenviada depois', async () => {
  const { ctx, enviadas, estado } = novoCenario([consulta1, consulta2]);
  estado.falhar.add('5511999990000');
  assert.deepEqual(await enviarLembretesDaVespera(ctx), { ok: true, enviados: 1, falhas: 1, jaEnviados: 0 });
  assert.deepEqual(
    enviadas.map((e) => e.para),
    ['5511888880000'],
  );
  assert.equal(ctx.repo.status(1), 'falhou');

  estado.falhar.clear();
  assert.deepEqual(await enviarLembretesDaVespera(ctx), { ok: true, enviados: 1, falhas: 0, jaEnviados: 1 });
  assert.deepEqual(
    enviadas.map((e) => e.para),
    ['5511888880000', '5511999990000'],
  );
});

test('sem provedor configurado é recusado e nada é enviado nem registrado', async () => {
  const { ctx, enviadas } = novoCenario([consulta1]);
  const r = await enviarLembretesDaVespera({ ...ctx, enviar: undefined });
  assert.ok(!r.ok && r.erro.tipo === 'recusado' && r.erro.mensagem === 'provedor de WhatsApp não configurado');
  assert.deepEqual(enviadas, []);
  assert.equal(ctx.repo.status(1), undefined);
});

test('consulta cancelada depois do envio não gera nova mensagem', async () => {
  const { ctx, enviadas, estado } = novoCenario([consulta1]);
  await enviarLembretesDaVespera(ctx);
  estado.canceladas.add(1);
  assert.deepEqual(await enviarLembretesDaVespera(ctx), { ok: true, enviados: 0, falhas: 0, jaEnviados: 0 });
  assert.equal(enviadas.length, 1);
});

test('paciente ou profissional que sumiu conta como falha, sem derrubar o lote', async () => {
  const { ctx, enviadas } = novoCenario([{ ...consulta1, paciente_id: 99 }, consulta2]);
  assert.deepEqual(await enviarLembretesDaVespera(ctx), { ok: true, enviados: 1, falhas: 1, jaEnviados: 0 });
  assert.equal(enviadas.length, 1);
});
