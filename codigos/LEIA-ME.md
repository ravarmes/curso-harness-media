# Capítulo 5: hooks e permissões no consultório

Esta branch é o estado do código no fim da prática guiada do capítulo 5. Ela parte da
`cap-04` e acrescenta, um commit por passo:

| Commit | O que entra |
|---|---|
| 1 | `meu-harness/hooks/`: `formatar.mjs`, `verificar-ao-parar.mjs`, `commit-so-verde.mjs` e a peça comum `comum.mjs` |
| 2 | `meu-harness/settings-usuario.json`: as permissões do usuário e os três hooks |
| 3 | Prettier e permissões do projeto (`.prettierrc.json`, `.claude/settings.json`) no modelo de projeto e no consultório |
| 4 | A formatação única dos dois projetos, num commit só dela |
| 5 | O provedor falso de WhatsApp (`consultorio/ferramentas/provedor-falso.ts`) e o `.env.exemplo` |
| 6 | O comando do provedor no `AGENTS.md` do consultório |
| 7 a 9 | O lembrete na véspera, **commits do próprio agente** na rodada: a especificação, a agenda das consultas de amanhã e o módulo `lembretes` |
| 10 | O quarto hook, `encerrar-pelo-pid.mjs`, para a falha F11 |
| 11 | A correção que a rodada mostrou: o hook passa a ler o comando dentro de `powershell -Command`, `cmd /c` e `bash -c` |
| 12 | O diário: F05, F08 e F11 resolvidas; F14 nova |
| 13 | Este guia |

Os commits 7 a 9 aparecem com o autor "Aluno do curso": é a identidade da pasta em que o
agente trabalhou, e as mensagens são as dele.

## Instalar os hooks e as permissões

Copie `meu-harness/settings-usuario.json` para `~/.claude/settings.json` (ou acrescente as
chaves `permissions` e `hooks` às que você já tem) e troque `/CAMINHO/ABSOLUTO/meu-harness`
pelo caminho real, com barras normais também no Windows
(`C:/Users/voce/meu-harness/hooks/formatar.mjs`). Numa sessão nova, `/hooks` deve listar os
quatro.

Para ver o JSON que cada hook recebe e devolve, aponte a variável `MEU_HARNESS_DEPURAR` para
um arquivo antes de abrir a sessão; cada chamada vira uma linha dele.

## Rodar o consultório (Node.js 22.18 ou mais recente)

```bash
cd consultorio
npm install                 # na primeira vez
cp .env.exemplo .env        # e troque o token por um texto seu
npm run verify              # tipos, testes e teste de arquitetura
npm run provedor            # provedor falso de WhatsApp em http://127.0.0.1:4010
npm run dev                 # API em http://localhost:3000, em outro terminal
```

Rota nova: `POST /lembretes/enviar-da-vespera`, que envia o lembrete das consultas de
amanhã e responde `{ enviados, falhas, jaEnviados }`. Chamá-la de novo não reenvia o que já
foi. As mensagens que o provedor recebeu aparecem no terminal dele e em `GET /mensagens`.

## A sua rodada vai sair diferente

Repare em quatro coisas na sua. O hook de parada devolveu o agente alguma vez, e por quê? O
agente escreveu arquivos pelo terminal, onde o formatador não alcança? Alguma permissão negou
uma ação, e ele procurou um caminho em volta? E, no relatório, ele diz o que não verificou?
O nosso disse que nunca chamou o provedor de verdade, e a conferência pela API foi feita à
parte.
