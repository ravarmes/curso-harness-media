# Capítulo 4: as skills do harness no consultório

Esta branch é o estado do código no fim da prática guiada do capítulo 4. Ela parte da
`cap-03` e acrescenta, um commit por passo:

| Commit | O que entra |
|---|---|
| 1 | `meu-harness/skills/`: as skills `especificar`, `implementar` e `depurar`, e a bateria de gatilho `especificar/gatilho.md` |
| 2 | A primeira fatia do cancelamento, **commit do próprio agente** na rodada: a especificação aprovada (`consultorio/docs/specs/cancelar-consulta.md`) e a situação da consulta |
| 3 | A segunda fatia, também **commit do agente**: `agenda/cancelar-consulta/`, com regra, teste e rota |
| 4 | **Plantado de propósito**, não escrito pelo agente: um defeito na agenda do dia (o dia começando à meia-noite UTC) e a retirada do teste que o pegaria |
| 5 | A correção que a skill `depurar` fez: o teste que reproduz o defeito e a linha corrigida |
| 6 | O diário: F03, F04 e F07 resolvidas; F13 nova |
| 7 | Este guia |

Os commits 2 e 3 aparecem com o autor "Aluno do curso": é a identidade da pasta em que o
agente trabalhou, e as mensagens são as dele.

## Instalar as skills sem copiar

As skills moram no `meu-harness` e a ferramenta aponta para elas:

```bash
# macOS, Linux ou WSL
mkdir -p ~/.claude/skills
for s in especificar implementar depurar; do ln -s ~/meu-harness/skills/$s ~/.claude/skills/$s; done

# Windows (PowerShell): junção de pastas, que não exige administrador
New-Item -ItemType Directory -Force "$HOME\.claude\skills" | Out-Null
foreach ($s in 'especificar','implementar','depurar') {
  New-Item -ItemType Junction -Path "$HOME\.claude\skills\$s" -Target "$HOME\meu-harness\skills\$s"
}
```

Numa sessão nova, `/skills` deve listar as três.

## Rodar o consultório (Node.js 22.18 ou mais recente)

```bash
cd consultorio
npm install          # na primeira vez
npm run verify       # tipos, testes e teste de arquitetura
npm run dev          # API em http://localhost:3000
```

Rota nova: `POST /consultas/:id/cancelamento`, com `{"quem": "paciente", "paciente_id": 1}`
ou `{"quem": "recepcao"}`.

## A sua rodada vai sair diferente

As perguntas que a `especificar` faz, e as respostas que você der, mudam a especificação.
Compare a sua com a nossa pelo que importa: cada critério tem entrada e saída concretas? A
regra tem critério de recusa? A fronteira das 24 horas exatas aparece? E, na implementação,
veja se o teste falhou pelo motivo certo antes de o código existir: o nosso agente viu o
vermelho, mas pelo motivo errado, e contou isso no relatório.
