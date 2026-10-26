// Hook do formatador: formata com o Prettier do projeto o arquivo que o agente
// editou (PostToolUse em Edit|Write) e os arquivos que um comando de terminal
// escreveu (PreToolUse e PostToolUse em Bash|PowerShell). Silencioso de
// propósito: não escreve nada, então não gasta contexto.
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { lerEntrada, responder } from './comum.mjs';

const entrada = lerEntrada();
const prettier = join(entrada.cwd, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
const formatos = ['.ts', '.js', '.mjs', '.json', '.md', '.css', '.html'];
// O retrato dos pendentes fica dentro de .git, fora do que se versiona.
const retrato = join(entrada.cwd, '.git', 'meu-harness-pendentes.json');

// Arquivos pendentes no Git (modificados e novos), com a hora da última mudança.
function pendentes() {
  const r = spawnSync('git', ['status', '--porcelain', '-uall', '-z'], { cwd: entrada.cwd, encoding: 'utf8' });
  if (r.status !== 0) return {};
  const mapa = {};
  const itens = r.stdout.split('\0');
  for (let i = 0; i < itens.length; i++) {
    if (!itens[i]) continue;
    const arquivo = itens[i].slice(3);
    if (/^[RC]/.test(itens[i])) i++; // renomeado: o item seguinte é o nome antigo
    try { mapa[arquivo] = statSync(join(entrada.cwd, arquivo)).mtimeMs; } catch { /* apagado */ }
  }
  return mapa;
}

function formatar(arquivos) {
  // O package-lock.json é do npm: formatá-lo só sujaria o diff.
  const alvos = arquivos.filter((a) => formatos.includes(extname(a)) && basename(a) !== 'package-lock.json');
  if (!alvos.length || !existsSync(prettier)) return 'nada a formatar';
  spawnSync(process.execPath, [prettier, '--write', '--log-level', 'silent', ...alvos], { cwd: entrada.cwd });
  return `formatou ${alvos.length} arquivo(s)`;
}

// Só o que fica dentro do projeto: um arquivo de fora (do meu-harness, por
// exemplo) seria formatado com a configuração do projeto, que não é a dele.
function dentroDoProjeto(caminho) {
  const r = relative(entrada.cwd, resolve(entrada.cwd, caminho));
  return r !== '' && !r.startsWith('..') && !isAbsolute(r);
}

let nota;
const arquivo = entrada.tool_input?.file_path;
if (arquivo && !dentroDoProjeto(arquivo)) {
  nota = 'fora do projeto, não formata';
} else if (arquivo) {
  // Edit ou Write: o arquivo que a ferramenta tocou.
  const antes = existsSync(arquivo) ? readFileSync(arquivo, 'utf8') : '';
  nota = formatar([arquivo]);
  if (nota !== 'nada a formatar') nota = readFileSync(arquivo, 'utf8') === antes ? 'já estava formatado' : 'formatou';
} else if (!existsSync(join(entrada.cwd, '.git'))) {
  nota = 'sem Git, sem retrato';
} else if (entrada.hook_event_name === 'PreToolUse') {
  // Antes do comando: o retrato do que já estava pendente, para não tocar nisso.
  writeFileSync(retrato, JSON.stringify(pendentes()));
  nota = 'retrato dos pendentes';
} else {
  // Depois do comando: só o que ele criou ou mudou.
  let antes = {};
  try { antes = JSON.parse(readFileSync(retrato, 'utf8')); } catch { /* sem retrato: tudo é novo */ }
  const depois = pendentes();
  nota = formatar(Object.keys(depois).filter((a) => antes[a] !== depois[a]));
}
responder('formatar', entrada, { nota });
