import { createServer, type IncomingMessage } from 'node:http';

// Roteador mínimo sobre node:http. É infraestrutura comum: não conhece
// nenhum módulo, e cada módulo entrega as suas rotas prontas.
export type Resposta = { status: number; corpo: unknown };
export type Manipulador = (corpo: unknown, params: Record<string, string>) => Resposta | Promise<Resposta>;
export type Rota = { metodo: 'GET' | 'POST' | 'PUT' | 'DELETE'; caminho: string; manipulador: Manipulador };

// '/pacientes/:id' vira /^\/pacientes\/(?<id>[^/]+)$/
function compilar(caminho: string): RegExp {
  return new RegExp(`^${caminho.replace(/:([a-zA-Z]+)/g, '(?<$1>[^/]+)')}$`);
}

async function lerCorpo(req: IncomingMessage): Promise<unknown> {
  let texto = '';
  for await (const pedaco of req) texto += pedaco;
  return texto ? JSON.parse(texto) : undefined;
}

export function criarServidor(rotas: Rota[]) {
  const compiladas = rotas.map((rota) => ({ ...rota, regex: compilar(rota.caminho) }));
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const rota = compiladas.find((r) => r.metodo === req.method && r.regex.test(url.pathname));
    let resposta: Resposta;
    if (!rota) {
      resposta = { status: 404, corpo: { erro: 'rota não encontrada' } };
    } else {
      try {
        const params = rota.regex.exec(url.pathname)?.groups ?? {};
        resposta = await rota.manipulador(await lerCorpo(req), params);
      } catch (erro) {
        resposta = erro instanceof SyntaxError
          ? { status: 400, corpo: { erro: 'JSON inválido' } }
          : { status: 500, corpo: { erro: 'erro interno' } };
      }
    }
    res.writeHead(resposta.status, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(resposta.corpo));
  });
}
