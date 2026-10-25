// Peças comuns aos hooks do harness: ler a entrada, resumir a saída de uma
// verificação que falhou e responder ao Claude Code. Com a variável
// MEU_HARNESS_DEPURAR apontando para um arquivo, cada resposta fica registrada
// nele, ao lado da entrada que o hook recebeu: é o jeito de ver o JSON real.
// Sem a variável, nada é registrado.
import { appendFileSync, readFileSync } from 'node:fs';

export function lerEntrada() {
  return JSON.parse(readFileSync(0, 'utf8'));
}

// A saída de uma verificação volta para o agente, e tudo o que volta gasta
// contexto: sem a pilha de chamadas, sem linhas gigantes, começando na primeira
// falha (o ✖ de um teste ou o error TS do tsc), até `maximo` linhas.
export function resumirFalha(saida, maximo) {
  const linhas = saida
    .split('\n')
    .filter((linha) => !/^\s+at /.test(linha))
    .map((linha) => (linha.length > 200 ? `${linha.slice(0, 200)}…` : linha));
  const inicio = Math.max(
    linhas.findIndex((linha) => /✖|error TS/.test(linha)),
    0,
  );
  return linhas
    .slice(inicio, inicio + maximo)
    .join('\n')
    .trim();
}

// codigo 0: a ação segue, e um JSON em stdout, se houver, é lido pelo Claude
// Code; codigo 2: bloqueia, e o stderr vai para o agente. A nota só vai para o
// registro de depuração.
export function responder(hook, entrada, { codigo = 0, stdout = '', stderr = '', nota } = {}) {
  const registro = process.env.MEU_HARNESS_DEPURAR;
  if (registro) {
    appendFileSync(registro, `${JSON.stringify({ hook, entrada, saida: { codigo, stdout, stderr }, nota })}\n`);
  }
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  process.exitCode = codigo;
}
