// Servidor MCP api-local: lê as especificações do projeto, sobe a API com um
// banco vazio e faz requisições a ela. Não lê código e só alcança a própria
// API, em 127.0.0.1: não abre um caminho para fora.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

// O Claude Code informa a raiz do projeto nesta variável.
const projeto = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
let api; // { processo, base } enquanto a API estiver no ar

const texto = (t, isError = false) => ({ isError, content: [{ type: 'text', text: t }] });

async function portaLivre() {
  const servidor = createServer().listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  const { port } = servidor.address();
  servidor.close();
  return port;
}

async function parar() {
  if (api && api.processo.exitCode === null) {
    api.processo.kill();
    await once(api.processo, 'exit');
  }
  api = undefined;
}

// Sobe src/servidor.ts (o modelo de projeto do Capítulo 3) com banco em memória.
// Devolve null se a API respondeu, ou o começo da saída de erro se não subiu.
async function subir() {
  await parar();
  const porta = await portaLivre();
  const processo = spawn(process.execPath, ['src/servidor.ts'], {
    cwd: projeto,
    env: { ...process.env, PORTA: String(porta), BANCO: ':memory:' },
    stdio: ['ignore', 'ignore', 'pipe'], // a saída padrão é do protocolo: a da API vai para o lixo
  });
  let erros = '';
  processo.stderr.on('data', (pedaco) => { erros += pedaco; });
  api = { processo, base: `http://127.0.0.1:${porta}` };
  for (let tentativa = 0; tentativa < 50 && processo.exitCode === null; tentativa++) {
    try {
      await fetch(api.base);
      return null;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  await parar();
  // Mesmo cuidado dos hooks do Capítulo 5: sem pilha de chamadas, só o começo do erro.
  const resumo = erros.split('\n').filter((linha) => !/^\s+at /.test(linha)).slice(0, 15);
  return resumo.join('\n').trim() || 'a API não respondeu em 5 segundos';
}

function criarServidor() {
  const servidor = new McpServer(
    { name: 'api-local', version: '1.0.0' },
    { instructions: 'Lê as especificações do projeto, sobe a API com um banco vazio e faz requisições a ela, só em 127.0.0.1. Use para conferir critérios de aceite pelo comportamento da API rodando.' },
  );

  servidor.registerTool('ler_especificacao', {
    description: 'Devolve o texto de uma especificação do projeto, de docs/specs/<nome>.md. É o único arquivo do projeto que este servidor lê.',
    inputSchema: z.object({
      nome: z.string().regex(/^[a-z0-9-]+$/).describe('Nome do arquivo, sem pasta e sem extensão, como bloqueio-por-faltas'),
    }),
  }, async ({ nome }) => {
    const arquivo = join(projeto, 'docs', 'specs', `${nome}.md`);
    if (existsSync(arquivo)) return texto(readFileSync(arquivo, 'utf8'));
    const pasta = join(projeto, 'docs', 'specs');
    const existentes = existsSync(pasta) ? readdirSync(pasta).join(', ') : 'nenhuma';
    return texto(`Especificação ${nome} não encontrada. Existentes: ${existentes}`, true);
  });

  servidor.registerTool('reiniciar_api', {
    description: 'Sobe a API do projeto, ou a reinicia, com um banco vazio em memória. Chame antes de cada critério de aceite, para partir de um estado conhecido.',
  }, async () => {
    const erro = await subir();
    return erro ? texto(`A API não subiu:\n${erro}`, true) : texto('API no ar, com banco vazio.');
  });

  servidor.registerTool('chamar_api', {
    description: 'Faz uma requisição HTTP à API do projeto e devolve o status e o corpo da resposta.',
    inputSchema: z.object({
      metodo: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
      caminho: z.string().regex(/^\/(?!\/)/).describe('Caminho da rota, começando com uma barra, como /pacientes/1'),
      corpo: z.unknown().optional().describe('Corpo JSON da requisição, para POST e PUT'),
      repetir: z.object({
        campo: z.string().describe('Campo do corpo que recebe o texto'),
        caractere: z.string().length(1),
        vezes: z.number().int().min(0).max(100000),
      }).optional().describe('Põe no campo do corpo um texto com o tamanho exato, como um texto de exatamente 300 caracteres. Use em vez de escrever um texto longo à mão.'),
    }),
  }, async ({ metodo, caminho, corpo, repetir }) => {
    if (!api) return texto('A API não está no ar: chame reiniciar_api antes.', true);
    const url = new URL(caminho, api.base);
    if (url.origin !== api.base) return texto('Só a API do projeto pode ser chamada.', true);
    // Contar caracteres é trabalho de programa, não de modelo.
    const enviado = repetir ? { ...(corpo ?? {}), [repetir.campo]: repetir.caractere.repeat(repetir.vezes) } : corpo;
    const resposta = await fetch(url, {
      method: metodo,
      headers: enviado === undefined ? {} : { 'content-type': 'application/json' },
      body: enviado === undefined ? undefined : JSON.stringify(enviado),
      // Não segue redirecionamentos: um Location apontando para outro endereço
      // abriria um caminho para fora da API. O 3xx volta como resposta.
      redirect: 'manual',
    });
    const corpoResposta = await resposta.text();
    const destino = resposta.headers.get('location');
    // A resposta entra no contexto do agente: corta o que passar de 2.000 caracteres.
    const curto = corpoResposta.length > 2000 ? `${corpoResposta.slice(0, 2000)}… (cortado)` : corpoResposta;
    return texto(`HTTP ${resposta.status}${destino ? ` (Location: ${destino})` : ''}\n${curto}`);
  });

  return servidor;
}

serveStdio(criarServidor);

// Quando o Claude Code fecha a conexão, a API não pode ficar rodando sozinha.
process.stdin.on('end', async () => {
  await parar();
  process.exit(0);
});
