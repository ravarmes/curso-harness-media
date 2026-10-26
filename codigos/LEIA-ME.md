# Capítulo 7: o servidor api-local e o verificador no consultório

Esta branch é o estado do código no fim da prática guiada do capítulo 7. Ela parte da
`cap-06` e acrescenta, um commit por passo:

| Commit | O que entra |
|---|---|
| 1 | `meu-harness/mcp/api-local/`: o servidor MCP (`ler_especificacao`, `reiniciar_api`, `chamar_api`), com as dependências fixadas no `package-lock.json`, e o `.gitignore` do `node_modules/` |
| 2 | `meu-harness/agents/verificador.md`: o subagente que confere os critérios de aceite pela API rodando |
| 3 | A skill `implementar` despacha o verificador depois do revisor (no máximo duas verificações) |
| 4 | `mcp__api-local` na lista de permitir de `settings-usuario.json` |
| 5 | Os horários livres de um profissional, **commit do próprio agente** na rodada: a especificação e `GET /profissionais/:id/horarios-livres/:data` |
| 6 e 7 | O diário: F06 resolvida no que passa pela API; F16 a F19 novas |
| 8 | Este guia |

O commit 5 aparece com o autor "Aluno do curso": é a identidade da pasta em que o agente
trabalhou, e a mensagem é a dele.

## Instalar o servidor e o verificador

```bash
cd ~/meu-harness/mcp/api-local
npm ci               # instala as versões exatas do package-lock.json
```

No `meu-harness/agents/verificador.md`, troque `/CAMINHO/ABSOLUTO/meu-harness` pelo caminho
real, com barras normais também no Windows. Se a pasta `agents` já está ligada à pasta pessoal
desde o capítulo 6, o verificador aparece sozinho: numa sessão nova, digite `@` e confira.
Acrescente `"mcp__api-local"` à lista `permissions.allow` do seu `~/.claude/settings.json`.

## Provocar o verificador

A branch `cap-06-provocacao` tem a funcionalidade de faltas com dois defeitos **plantados de
propósito** (a recusa compara com `> 3`, e registrar falta numa consulta que não existe devolve
400 em vez de 404) e os testes que os pegariam enfraquecidos. O `npm run verify` passa. Num
clone à parte, com o verificador instalado no seu `~/meu-harness`:

```bash
git clone https://github.com/ravarmes/curso-harness-media provoca-verificador
cd provoca-verificador
git checkout cap-06-provocacao
cd codigos/consultorio
npm install
# numa sessão aberta nesta pasta:
#   Use o verificador para verificar a especificação bloqueio-por-faltas.
```

## Rodar o consultório (Node.js 22.18 ou mais recente)

```bash
cd consultorio
npm install          # na primeira vez
npm run verify       # tipos, testes e teste de arquitetura
npm run dev          # API em http://localhost:3000
```

Rota nova: `GET /profissionais/:id/horarios-livres/:data`, com `data` no formato
`AAAA-MM-DD` (dia de Brasília). Devolve os horários de 30 minutos, encadeados a partir do
início de cada faixa do expediente, em que o profissional não tem consulta.

## A sua rodada vai sair diferente

Repare em três coisas na sua. A `implementar` despachou o verificador depois do revisor, com o
nome da especificação? Cada linha do relatório dele corresponde a uma chamada que aparece na
sessão? E o que ele marcou como não verificável, e por quê? O nosso aprovou os horários livres
com três ressalvas, todas por causa do relógio, que a API não deixa fixar; na provocação, achou
os dois defeitos pela API, e o agente principal descartou as alterações pendentes sem que ninguém pedisse.
