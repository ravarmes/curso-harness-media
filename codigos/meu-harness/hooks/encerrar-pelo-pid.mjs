// Hook PreToolUse (Bash|PowerShell): só deixa encerrar processo pelo número
// (PID). Por nome (taskkill /IM node.exe, pkill node, Stop-Process -Name node)
// ou por uma lista vinda de outro comando (Get-Process node | Stop-Process), o
// agente derruba processos que não são dele.
import { lerEntrada, responder } from './comum.mjs';

// Um trecho que encerra processo, inclusive pelo CIM e pelo WMI do Windows...
const ENCERRA = /\b(?:taskkill|tskill|pkill|killall|kill|stop-process|spps|invoke-cimmethod|invoke-wmimethod|remove-ciminstance|remove-wmiobject|wmic)\b|\.(?:kill|terminate)\s*\(/i;
// ...só passa numa destas formas, com o número escrito no comando.
const PELO_PID = [
  /^kill(?:\s+-(?:s\s+)?\w+)?(?:\s+(?:\d+|\$!|%\d+))+$/i, // kill 4242, kill -9 4242, kill -s TERM 4242, kill $!
  /^(?:stop-process|spps|kill)(?:\s+-force)?\s+(?:-id\s+)?\d+(?:\s*,\s*\d+)*(?:\s+-force)?$/i, // Stop-Process -Id 4242
  /^taskkill(?:\s+\/\/?[ft])*(?:\s+\/\/?pid\s+\d+(?:\s+\/\/?[ft])*)+$/i, // taskkill /PID 4242 /F (no Git Bash, //PID e //F)
];
// O que pode vir depois sem mudar o alvo: redirecionamento e as opções de erro,
// de confirmação e de saída do PowerShell.
const CAUDA = /(?:\s+(?:\d?>>?\s*(?:&\d|\S+)|-erroraction\s+\w+|-ea\s+\w+|-confirm:\$false|-passthru))+$/i;
// Busca e mensagem de commit só citam o nome.
const SO_CITA = /^(?:grep|egrep|fgrep|rg|findstr|select-string|sls|git\s+(?:commit|grep|log|show|diff))\b/i;
// powershell -Command "…" (com opções antes, como -ExecutionPolicy Bypass), cmd /c "…"
// e bash -c '…' rodam o que está entre as aspas; & { … } roda o que está no bloco.
const EMBRULHO =
  /\b(?:powershell|pwsh)(?:\.exe)?(?:\s+-(?!c\b|command\b)\w+(?:\s+[^\s"'-][^\s"']*)?)*?\s+-(?:command|c)\s+(["'])(.*?)\1|\bcmd(?:\.exe)?\s+\/\/?c\s+(["'])(.*?)\3|\b(?:ba)?sh\s+-c\s+(["'])(.*?)\5/gi;
const BLOCO = /&\s*\{\s*([^{}]*?)\s*\}/g;

const entrada = lerEntrada();
// Cada comando de uma linha composta, e cada $(...) ou `...`, é um trecho. Do
// trecho sai a variável na frente (MSYS_NO_PATHCONV=1), que não muda o alvo.
const comando = String(entrada.tool_input?.command ?? '')
  .replace(EMBRULHO, (_, a, ps, b, cmd, c, sh) => ps ?? cmd ?? sh)
  .replace(BLOCO, '$1')
  // Get-Process -Id <pid> | Stop-Process também é pelo número.
  .replace(/\b(?:get-process|gps|ps)\s+-id\s+(\d+(?:\s*,\s*\d+)*)\s*\|\s*(?:stop-process|spps|kill)\b/gi, 'Stop-Process -Id $1');
const trechos = comando
  .split(/&&|\|\||;|\||\n|\$\(|`/)
  .map((t) => t.trim().replace(/\)+$/, '').replace(/^(\w+=\S*\s+)+/, '').trim())
  .filter(Boolean);
const encerram = trechos.filter((t) => !SO_CITA.test(t) && ENCERRA.test(t));
const proibido = encerram.find((t) => !PELO_PID.some((forma) => forma.test(t.replace(CAUDA, ''))));

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
          `Encerre só o seu processo, pelo número: Stop-Process -Id <pid> ou taskkill /PID <pid> /F ` +
          `(no Git Bash, taskkill //PID <pid> //F; o kill <pid> do Git Bash só alcança o que ele mesmo abriu). ` +
          `Por nome ou por lista, o comando derruba processos que não são seus. (${proibido})`,
      },
    }),
  });
}
