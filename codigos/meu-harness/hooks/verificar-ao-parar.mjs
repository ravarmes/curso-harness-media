// Hook Stop: não deixa o agente encerrar com o `npm run verify` falhando.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { lerEntrada, responder, resumirFalha } from './comum.mjs';

const entrada = lerEntrada();
responder('verificar-ao-parar', entrada, decidir());

// Devolve o agente com o motivo; na segunda vez, deixa encerrar com um aviso,
// para não prender a sessão num ciclo.
function devolver(nota, motivo, aviso) {
  if (entrada.stop_hook_active) {
    return { nota: `${nota}; liberado com aviso`, stdout: JSON.stringify({ systemMessage: `Atenção: a sessão terminou ${aviso}.` }) };
  }
  return { nota: `${nota}; agente devolvido`, codigo: 2, stderr: motivo };
}

function decidir() {
  // Projeto sem verify: não há o que cobrar.
  const pacote = join(entrada.cwd, 'package.json');
  if (!existsSync(pacote)) return { nota: 'projeto sem package.json' };
  let scripts;
  try {
    scripts = JSON.parse(readFileSync(pacote, 'utf8')).scripts;
  } catch (erro) {
    return devolver('package.json inválido', `O package.json está inválido (${erro.message}). Corrija antes de encerrar.`,
      'com o package.json inválido');
  }
  if (!scripts?.verify) return { nota: 'projeto sem verify' };

  // Num repositório Git sem mudanças pendentes, o último commit já passou pelo
  // hook commit-so-verde: não há o que conferir de novo.
  const git = spawnSync('git', ['status', '--porcelain'], { cwd: entrada.cwd, encoding: 'utf8' });
  if (git.status === 0 && git.stdout.trim() === '') return { nota: 'Git limpo, nada a conferir' };

  const verify = spawnSync('npm run verify', { cwd: entrada.cwd, encoding: 'utf8', shell: true });
  if (verify.status === 0) return { nota: 'verify passou' };

  const resumo = resumirFalha(`${verify.stdout}\n${verify.stderr}`, 30);
  return devolver('verify falhou', `O npm run verify está falhando. Corrija o código antes de encerrar.\n\n${resumo}`,
    'com o npm run verify falhando');
}
