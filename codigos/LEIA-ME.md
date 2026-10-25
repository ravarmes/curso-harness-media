# Capítulo 3: o consultório renasce no modelo de projeto

Esta branch é o estado do código no fim da prática guiada do capítulo 3. Ela parte da
`cap-02` e acrescenta, um commit por passo:

| Commit | O que entra |
|---|---|
| 1 | `meu-harness/templates/projeto-ts/`: o modelo de projeto (monólito modular em fatias verticais, guia de arquitetura, teste de arquitetura e `npm run verify`) |
| 2 | `consultorio/` recomeça do modelo, com o `AGENTS.md` do projeto; o consultório em Python vai para `consultorio-v0/`, só para consulta |
| 3 | Os cadastros de pacientes e de profissionais, com o expediente, **exatamente como a rodada os entregou** |
| 4 | O agendamento e a agenda do dia, **exatamente como a rodada os entregou** |
| 5 | **Plantado de propósito**, não escrito pelo agente: um atalho da agenda para o repositório de pacientes, para o teste de arquitetura ter o que pegar |
| 6 | A correção que o agente fez depois de ler a mensagem do teste |
| 7 | O consultório em Python sai (ele continua nas branches `cap-01` e `cap-02`) |
| 8 | O diário: F02 resolvida, F12 nova |
| 9 | Este guia |

Para ver cada passo: `git log --oneline cap-02..cap-03` e `git show <commit>`. O
compare entre `cap-02` e `cap-03` mostra o capítulo inteiro.

## Rodar o consultório (Node.js 22.18 ou mais recente)

```bash
cd consultorio
npm install          # na primeira vez
npm run verify       # tipos, testes e teste de arquitetura
npm run dev          # API em http://localhost:3000
```

As rotas: `POST /pacientes`, `POST /profissionais`, `PUT /profissionais/:id/expediente`,
`POST /consultas` e `GET /profissionais/:id/agenda/:data` (data no formato `AAAA-MM-DD`).
Os horários vão em ISO 8601 com offset, como `2026-11-10T14:00:00-03:00`.

## Para provocar o sensor você mesmo

Volte o commit 6 (`git revert` ou `git checkout <commit 5> -- consultorio/src`) e rode
`npm run verify`: a regra 1 reprova e diz o que fazer. Depois experimente outras violações,
como importar `node:http` dentro de uma regra de negócio.

## A sua rodada vai sair diferente

O nosso agente leu o guia de arquitetura antes de escrever e não quebrou nenhuma fronteira,
por isso o atalho do commit 5 foi plantado. O seu pode quebrar uma sozinho: se acontecer,
você vê o sensor de verdade. Compare também o desenho das fatias: o nosso entregou o
repositório à rota em vez da regra pronta, algo que o teste de arquitetura não confere.
