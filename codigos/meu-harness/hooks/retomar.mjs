// Hook SessionStart: num projeto com trabalho em andamento, põe no contexto onde
// a última sessão parou e qual é a próxima funcionalidade. Nos outros, não diz nada.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { lerEntrada, responder } from './comum.mjs';

const entrada = lerEntrada();
const lista = join(entrada.cwd, 'docs', 'funcionalidades.json');
if (!existsSync(lista)) {
  responder('retomar', entrada, { nota: 'sem tarefa longa' });
  process.exit(0);
}

let funcionalidades;
try {
  funcionalidades = JSON.parse(readFileSync(lista, 'utf8'));
} catch (erro) {
  responder('retomar', entrada, {
    stdout: `docs/funcionalidades.json está inválido (${erro.message}). Corrija o arquivo antes de continuar.\n`,
    nota: 'lista inválida',
  });
  process.exit(0);
}

const feitas = funcionalidades.filter((f) => f.passa).length;
const proxima = funcionalidades.find((f) => !f.passa);
const progresso = join(entrada.cwd, 'docs', 'progresso.md');
// Só a última entrada do progresso: cada sessão começa com uma linha "## ".
const ultima = existsSync(progresso)
  ? readFileSync(progresso, 'utf8').split(/\n(?=## )/).at(-1).trim().slice(0, 1500)
  : '(nenhuma)';

const texto = [
  `Trabalho em andamento: ${feitas} de ${funcionalidades.length} funcionalidades passam (docs/funcionalidades.json).`,
  proxima ? `Próxima: ${proxima.id}, ${proxima.descricao}` : 'Todas passam: confirme com o usuário se o projeto terminou.',
  '',
  'Última sessão registrada em docs/progresso.md:',
  ultima,
  '',
  'Uma funcionalidade por sessão: especificar, implementar (com revisor e verificador), marcar "passa": true',
  'só com o verificador aprovando, registrar a sessão em docs/progresso.md e fazer commit.',
].join('\n');
responder('retomar', entrada, { stdout: `${texto}\n`, nota: `${feitas} de ${funcionalidades.length}` });
