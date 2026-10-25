// Provedor de WhatsApp falso, para desenvolver e testar o lembrete sem mandar
// mensagem de verdade. Sobe em http://127.0.0.1:4010 e aceita
// POST /mensagens { para, texto } com o cabeçalho Authorization: Bearer <token>;
// guarda as mensagens em memória e devolve { id }. GET /mensagens lista o que
// chegou. Sem o token certo, responde 401.
//
// Uso: npm run provedor (lê o WHATSAPP_TOKEN do .env, o mesmo que a API usa).
import { randomUUID } from 'node:crypto';
import { createServer, type ServerResponse } from 'node:http';

const porta = Number(process.env.PROVEDOR_PORTA ?? 4010);
const token = process.env.WHATSAPP_TOKEN;
if (!token) {
  console.error('Defina WHATSAPP_TOKEN no .env (copie o .env.exemplo).');
  process.exit(1);
}

type Mensagem = { id: string; para: string; texto: string; recebidaEm: string };
const mensagens: Mensagem[] = [];

function responder(res: ServerResponse, status: number, corpo: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(corpo));
}

createServer(async (req, res) => {
  if (req.headers.authorization !== `Bearer ${token}`) return responder(res, 401, { erro: 'token inválido' });
  if (req.method === 'GET' && req.url === '/mensagens') return responder(res, 200, mensagens);
  if (req.method !== 'POST' || req.url !== '/mensagens') return responder(res, 404, { erro: 'rota inexistente' });

  let corpo = '';
  for await (const parte of req) corpo += parte;
  let dados: { para?: unknown; texto?: unknown };
  try {
    dados = JSON.parse(corpo);
  } catch {
    return responder(res, 400, { erro: 'corpo não é JSON' });
  }
  if (typeof dados.para !== 'string' || typeof dados.texto !== 'string') {
    return responder(res, 400, { erro: 'informe para e texto' });
  }
  const mensagem = { id: randomUUID(), para: dados.para, texto: dados.texto, recebidaEm: new Date().toISOString() };
  mensagens.push(mensagem);
  console.log(`mensagem para ${mensagem.para}: ${mensagem.texto}`);
  responder(res, 200, { id: mensagem.id });
}).listen(porta, '127.0.0.1', () => console.log(`Provedor falso em http://127.0.0.1:${porta}`));
