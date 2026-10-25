// Hook PostToolUse (Edit|Write): formata o arquivo editado com o Prettier do
// projeto. Silencioso de propósito: não escreve nada, então não gasta contexto,
// e o agente nem precisa saber que ele existe.
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { lerEntrada, responder } from './comum.mjs';

const entrada = lerEntrada();
const arquivo = entrada.tool_input?.file_path;
const prettier = join(entrada.cwd, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
const formatos = ['.ts', '.js', '.mjs', '.json', '.md', '.css', '.html'];

let nota = 'nada a formatar';
if (arquivo && existsSync(prettier) && formatos.includes(extname(arquivo))) {
  const antes = readFileSync(arquivo, 'utf8');
  spawnSync(process.execPath, [prettier, '--write', '--log-level', 'silent', arquivo], { cwd: entrada.cwd });
  nota = readFileSync(arquivo, 'utf8') === antes ? 'já estava formatado' : 'formatou';
}
responder('formatar', entrada, { nota });
