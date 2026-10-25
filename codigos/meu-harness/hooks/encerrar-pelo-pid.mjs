// Hook PreToolUse (Bash|PowerShell): só deixa encerrar processo pelo número
// (PID). Por nome (taskkill /IM node.exe, pkill node, Stop-Process -Name node)
// ou por uma lista vinda de outro comando (Get-Process node | Stop-Process), o
// agente derruba processos que não são dele.
import { lerEntrada, responder } from './comum.mjs';

// Um trecho que encerra processo...
const ENCERRA = /\b(?:taskkill|tskill|pkill|killall|kill|stop-process|spps)\b|\.kill\s*\(/i;
// ...só passa numa destas formas, com o número escrito no comando.
const PELO_PID = [
  /^kill(?:\s+-\w+)?(?:\s+(?:\d+|\$!|%\d+))+$/i, // kill 4242, kill -9 4242, kill $!
  /^(?:stop-process|spps|kill)(?:\s+-force)?\s+(?:-id\s+)?\d+(?:\s*,\s*\d+)*(?:\s+-force)?$/i, // Stop-Process -Id 4242
  /^taskkill(?:\s+\/\/?[ft])*(?:\s+\/\/?pid\s+\d+(?:\s+\/\/?[ft])*)+$/i, // taskkill /PID 4242 /F
];
// Busca e mensagem de commit só citam o nome.
const SO_CITA = /^(?:grep|rg|findstr|select-string|git\s+(?:commit|grep|log|show|diff))\b/i;
// powershell -Command "…", cmd /c "…" e bash -c '…' rodam o que está entre as aspas.
const EMBRULHO =
  /\b(?:powershell|pwsh)(?:\.exe)?(?:\s+-\w+)*?\s+-(?:command|c)\s+(["'])(.*?)\1|\bcmd(?:\.exe)?\s+\/\/?c\s+(["'])(.*?)\3|\b(?:ba)?sh\s+-c\s+(["'])(.*?)\5/gi;

const entrada = lerEntrada();
// Cada comando de uma linha composta, e cada $(...) ou `...`, é um trecho.
const trechos = String(entrada.tool_input?.command ?? '')
  .replace(EMBRULHO, (_, a, ps, b, cmd, c, sh) => ps ?? cmd ?? sh)
  .split(/&&|\|\||;|\||\n|\$\(|`/)
  .map((t) => t.replace(/\)+\s*$/, '').replace(/\s+\d?>>?\s*\S+$/, '').trim())
  .filter(Boolean);
const encerram = trechos.filter((t) => !SO_CITA.test(t) && ENCERRA.test(t));
const proibido = encerram.find((t) => !PELO_PID.some((forma) => forma.test(t)));

if (!encerram.length) responder('encerrar-pelo-pid', entrada, { nota: 'não encerra processo' });
else if (!proibido) responder('encerrar-pelo-pid', entrada, { nota: 'encerra pelo PID; liberado' });
else {
  responder('encerrar-pelo-pid', entrada, {
    nota: `negado: ${proibido}`,
    stdout: JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          `Encerre só o seu processo, pelo número: kill <pid>, Stop-Process -Id <pid> ou taskkill /PID <pid> /F. ` +
          `Por nome ou por lista, o comando derruba processos que não são seus. (${proibido})`,
      },
    }),
  });
}
