// Hook PreToolUse (Bash|PowerShell): só deixa fazer `git commit` com o
// `npm run verify` passando.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { lerEntrada, responder, resumirFalha } from './comum.mjs';

const entrada = lerEntrada();
responder('commit-so-verde', entrada, decidir());

function decidir() {
  const comando = entrada.tool_input?.command ?? '';
  if (!/\bgit\s+commit\b/.test(comando)) return { nota: 'não é commit' };

  const pacote = join(entrada.cwd, 'package.json');
  if (!existsSync(pacote) || !JSON.parse(readFileSync(pacote, 'utf8')).scripts?.verify) {
    return { nota: 'projeto sem verify' };
  }

  const verify = spawnSync('npm run verify', { cwd: entrada.cwd, encoding: 'utf8', shell: true });
  if (verify.status === 0) return { nota: 'verify passou; commit liberado' };

  const resumo = resumirFalha(`${verify.stdout}\n${verify.stderr}`, 20);
  return {
    nota: 'verify falhou; commit negado',
    stdout: JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `Commit bloqueado: o npm run verify está falhando. Corrija e tente de novo.\n\n${resumo}`,
      },
    }),
  };
}
