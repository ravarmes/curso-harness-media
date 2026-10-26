# Capítulo 8: o harness como plugin e a fase 2 do consultório

Esta branch é o estado do código no fim da parte do consultório da prática guiada do
capítulo 8. Ela parte da `cap-07` e acrescenta:

| Commits | O que entra |
|---|---|
| 1 e 2 | A skill `iniciar-projeto` (com o `iniciar.mjs`, que cria um projeto a partir do modelo) e o hook `retomar.mjs`, que abre cada sessão com o estado da tarefa longa |
| 3 | O harness como plugin: `.claude-plugin/plugin.json` (com o servidor `api-local`), `.claude-plugin/marketplace.json`, `hooks/hooks.json`, o cabeçalho novo do verificador e o `settings-usuario.json` só com permissões |
| 4 a 9 | O ciclo de melhoria, uma falha do diário por commit: F14 (o formatador alcança o terminal), F16 (o hook do PID e o Git Bash), F17 e F18 (o veredito e a descrição do verificador), F15 e F19 (relatar antes de corrigir; perguntar antes de descartar), F20 (a descrição da `implementar`) e F21 (a `especificar` conta as funcionalidades, em duas tentativas) |
| 10 a 20 | A fase 2 do consultório, **commits do próprio agente** nas rodadas: a lista em `docs/funcionalidades.json` e uma funcionalidade por sessão (F1 remarcar, F2 relatório de ocupação, F3 lista de espera) |
| 21 a 25 | O diário fechado, este guia e as correções da revisão final dos hooks (ver o fim do diário) |

Os commits da fase 2 aparecem com o autor "Aluno do curso": é a identidade da pasta em que o
agente trabalhou, e as mensagens são as dele. A F4 (aviso de vaga) continua com
`"passa": false`: é a próxima sessão.

## Instalar o harness como plugin

Antes, desfaça a instalação provisória dos capítulos anteriores: os links das skills e dos
agentes em `~/.claude/`, e a chave `hooks` do seu `~/.claude/settings.json` (os hooks passam a vir
do plugin; deixados nas configurações, rodariam duas vezes). Depois:

```bash
cd ~/meu-harness/mcp/api-local && npm ci && cd ../..
claude plugin validate .
claude plugin marketplace add ~/meu-harness       # no Windows: "$HOME\meu-harness"
claude plugin install meu-harness@pessoal
```

Na lista `allow` do `~/.claude/settings.json`, troque `"mcp__api-local"` por
`"mcp__plugin_meu-harness_api-local"`, e copie da `settings-usuario.json` as linhas novas de `ask`.
Numa sessão nova, `/context` deve listar os agentes e as skills com o prefixo `meu-harness:`.

## Rodar o consultório (Node.js 22.18 ou mais recente)

```bash
cd consultorio
npm install          # na primeira vez
npm run verify       # tipos, testes e teste de arquitetura
npm run dev          # API em http://localhost:3000
```

Rotas novas: `POST /consultas/:id/remarcacao`, `GET /relatorios/ocupacao/:de/:ate`,
`POST /lista-de-espera`, `DELETE /lista-de-espera/:id` e
`GET /profissionais/:id/lista-de-espera/:data`.

## A sua rodada vai sair diferente

Repare em três coisas na sua. A fase 2 virou uma lista, ou uma especificação só? Cada sessão
abriu com o resumo do `retomar.mjs` e terminou numa funcionalidade, com `"passa": true` só depois
do verificador? E o diário: que falha nova apareceu, e que controle ela pede?
