// Cria um projeto a partir do modelo do harness: copia, instala, verifica e faz
// o primeiro commit. Fica calado quando dá certo; quando falha, mostra o porquê.
// Uso: node iniciar.mjs <pasta> "<nome do projeto>"
import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const [pasta, nome] = process.argv.slice(2);
if (!pasta || !nome) {
  console.error('Uso: node iniciar.mjs <pasta> "<nome do projeto>"');
  process.exit(1);
}

const modelo = resolve(dirname(fileURLToPath(import.meta.url)), '../../templates/projeto-ts');
const destino = resolve(pasta);
// Arquivos ocultos (como .claude/ ou .git/) não contam: a pasta pode tê-los.
if (existsSync(destino) && readdirSync(destino).some((item) => !item.startsWith('.'))) {
  console.error(`A pasta ${destino} não está vazia. Use uma pasta nova.`);
  process.exit(1);
}

cpSync(modelo, destino, { recursive: true, filter: (origem) => basename(origem) !== 'node_modules' });
const agents = join(destino, 'AGENTS.md');
writeFileSync(agents, readFileSync(agents, 'utf8').replace('[Nome do projeto]', nome));

function rodar(comando, args) {
  // No Windows, o npm é um .cmd e só roda por um shell; o git roda direto. Pelo
  // shell, o comando vai numa linha só (os argumentos daqui não têm espaço): o
  // Node 24 avisa, na saída de erro, quando recebe argumentos separados com shell.
  const shell = process.platform === 'win32' && comando === 'npm';
  const r = shell
    ? spawnSync(`${comando} ${args.join(' ')}`, { cwd: destino, encoding: 'utf8', shell })
    : spawnSync(comando, args, { cwd: destino, encoding: 'utf8' });
  if (r.status !== 0) {
    // O mesmo resumo dos hooks do Capítulo 5: sem pilha, a partir da primeira falha.
    const linhas = `${r.stdout ?? ''}\n${r.stderr ?? ''}`.split('\n').filter((linha) => !/^\s+at /.test(linha));
    const inicio = Math.max(linhas.findIndex((linha) => /✖|error TS/.test(linha)), 0);
    console.error(`Falhou: ${comando} ${args.join(' ')}\n\n${linhas.slice(inicio, inicio + 20).join('\n').trim()}`);
    process.exit(1);
  }
}

rodar('git', ['init', '--quiet']);
rodar('npm', ['install', '--silent']);
rodar('npm', ['run', 'verify', '--silent']);
rodar('git', ['add', '.']);
rodar('git', ['commit', '--quiet', '-m', 'chore: create project from harness template']);
console.log(`Projeto "${nome}" criado em ${destino}, com a verificação passando e o primeiro commit.`);
