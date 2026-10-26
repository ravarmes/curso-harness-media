// Hook PreToolUse (Bash|PowerShell): só deixa fazer `git commit` com o
// `npm run verify` passando.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { lerEntrada, responder, resumirFalha } from './comum.mjs';

const entrada = lerEntrada();
responder('commit-so-verde', entrada, decidir());

function negar(motivo) {
  return JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: motivo },
  });
}

function decidir() {
  const comando = entrada.tool_input?.command ?? '';
  // git commit, inclusive com opções do git antes (git -C pasta commit, git -c chave=valor commit).
  const commit = /\bgit((?:\s+(?:-C\s+\S+|-c\s+\S+|--[\w-]+(?:=\S+)?))*)\s+commit\b/.exec(comando);
  if (!commit) return { nota: 'não é commit' };
  const pasta = /-C\s+(\S+)/.exec(commit[1]);
  const cwd = pasta ? resolve(entrada.cwd, pasta[1].replace(/^["']|["']$/g, '')) : entrada.cwd;

  const pacote = join(cwd, 'package.json');
  if (!existsSync(pacote)) return { nota: 'projeto sem package.json' };
  let scripts;
  try {
    scripts = JSON.parse(readFileSync(pacote, 'utf8')).scripts;
  } catch (erro) {
    // Um package.json quebrado é um projeto quebrado: o commit não passa.
    return { nota: 'package.json inválido; commit negado', stdout: negar(`Commit bloqueado: o package.json está inválido (${erro.message}).`) };
  }
  if (!scripts?.verify) return { nota: 'projeto sem verify' };

  const verify = spawnSync('npm run verify', { cwd, encoding: 'utf8', shell: true });
  if (verify.status === 0) return { nota: 'verify passou; commit liberado' };

  const resumo = resumirFalha(`${verify.stdout}\n${verify.stderr}`, 20);
  return {
    nota: 'verify falhou; commit negado',
    stdout: negar(`Commit bloqueado: o npm run verify está falhando. Corrija e tente de novo.\n\n${resumo}`),
  };
}
