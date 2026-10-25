# Capítulo 6: explorador e revisor no consultório

Esta branch é o estado do código no fim da prática guiada do capítulo 6. Ela parte da
`cap-05` e acrescenta, um commit por passo:

| Commit | O que entra |
|---|---|
| 1 | `meu-harness/agents/`: o `explorador` e o `revisor` |
| 2 | A skill `implementar` anota o commit de base e despacha o revisor no fim (no máximo duas revisões) |
| 3 | `Bash(git rev-parse *)` na lista de permitir de `settings-usuario.json` |
| 4 e 5 | O bloqueio por faltas, **commits do próprio agente** na rodada: registrar a falta (`POST /consultas/:id/falta`) e recusar o agendamento com 3 faltas nos últimos 90 dias |
| 6 | O diário: F12 resolvida; F15 nova |
| 7 | Este guia |

Os commits 4 e 5 aparecem com o autor "Aluno do curso": é a identidade da pasta em que o
agente trabalhou, e as mensagens são as dele.

## A branch da provocação: `cap-06-provocacao`

Nasce do commit 3 e tem um commit só, **plantado de propósito**: a funcionalidade de faltas do
agente com dois defeitos (a recusa compara com `> 3`, e registrar falta numa consulta que não
existe devolve 400 em vez de 404) e os testes que os pegariam enfraquecidos. O
`npm run verify` passa. Use-a para provocar o revisor:

```bash
git checkout cap-06-provocacao
cd codigos/consultorio
npm install
# numa sessão com o revisor instalado:
#   Revise a fatia de bloqueio por faltas contra docs/specs/bloqueio-por-faltas.md, com base em HEAD~1.
```

## Instalar os agentes sem copiar

```bash
# macOS, Linux ou WSL
ln -s ~/meu-harness/agents ~/.claude/agents

# Windows (PowerShell): junção de pastas, que não exige administrador
New-Item -ItemType Junction -Path "$HOME\.claude\agents" -Target "$HOME\meu-harness\agents"
```

A pasta `~/.claude/agents` não pode existir antes do link. Numa sessão nova, digite `@` e
confira se `explorador` e `revisor` aparecem.

## Rodar o consultório (Node.js 22.18 ou mais recente)

```bash
cd consultorio
npm install          # na primeira vez
npm run verify       # tipos, testes e teste de arquitetura
npm run dev          # API em http://localhost:3000
```

Rota nova: `POST /consultas/:id/falta`, para uma consulta agendada que já terminou. O
agendamento de um paciente com 3 ou mais faltas nos últimos 90 dias (pela data de Brasília)
responde 409.

## A sua rodada vai sair diferente

Repare em três coisas na sua. A `implementar` despachou o revisor com a especificação e a
base? O que ele marcou como bloqueio era defeito de verdade, e os achados de melhoria ficaram
no relatório? E, na provocação, o que ele achou e o que deixou passar? O nosso achou os dois
defeitos e os três testes fracos, e o agente principal corrigiu tudo sem que ninguém pedisse.
