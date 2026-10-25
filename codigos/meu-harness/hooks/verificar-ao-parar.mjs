// Hook Stop: não deixa o agente encerrar com o `npm run verify` falhando.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { lerEntrada, responder, resumirFalha } from './comum.mjs';

const entrada = lerEntrada();
responder('verificar-ao-parar', entrada, decidir());

function decidir() {
  // Projeto sem verify: não há o que cobrar.
  const pacote = join(entrada.cwd, 'package.json');
  if (!existsSync(pacote) || !JSON.parse(readFileSync(pacote, 'utf8')).scripts?.verify) {
    return { nota: 'projeto sem verify' };
  }

  // Num repositório Git sem mudanças pendentes, o último commit já passou pelo
  // hook commit-so-verde: não há o que conferir de novo.
  const git = spawnSync('git', ['status', '--porcelain'], { cwd: entrada.cwd, encoding: 'utf8' });
  if (git.status === 0 && git.stdout.trim() === '') return { nota: 'Git limpo, nada a conferir' };

  const verify = spawnSync('npm run verify', { cwd: entrada.cwd, encoding: 'utf8', shell: true });
  if (verify.status === 0) return { nota: 'verify passou' };

  if (entrada.stop_hook_active) {
    // O agente já foi mandado de volta uma vez e a verificação continua
    // falhando. Deixa encerrar, para não prender a sessão num ciclo, mas avisa você.
    return {
      nota: 'verify falhou de novo; liberado com aviso',
      stdout: JSON.stringify({ systemMessage: 'Atenção: a sessão terminou com o npm run verify falhando.' }),
    };
  }
  const resumo = resumirFalha(`${verify.stdout}\n${verify.stderr}`, 30);
  return {
    nota: 'verify falhou; agente devolvido',
    codigo: 2,
    stderr: `O npm run verify está falhando. Corrija o código antes de encerrar.\n\n${resumo}`,
  };
}
