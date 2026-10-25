# Capítulo 2: o consultório com instruções

Esta branch é o estado do código no fim da prática guiada do capítulo 2. Ela parte da
`cap-01` e acrescenta, um commit por passo:

| Commit | O que entra |
|---|---|
| 1 | `meu-harness/AGENTS.global.md`: as suas instruções globais, que valem em todo projeto |
| 2 | `meu-harness/templates/AGENTS.projeto.md`: o modelo para o `AGENTS.md` de cada projeto |
| 3 | `consultorio/AGENTS.md`: as instruções deste projeto (comandos, contrato de erros, fuso) |
| 4 | O expediente dos profissionais, **exatamente como a rodada com instruções o entregou** |
| 5 | A correção das instruções que a rodada mostrou estarem incompletas |
| 6 | O diário com o que mudou: F01 e F09 resolvidas, F10 e F11 novas |
| 7 | Este guia |

Para ver cada passo: `git log --oneline cap-01..cap-02` e `git show <commit>`.

## Ligar as instruções globais na sua máquina

O Claude Code lê `~/.claude/CLAUDE.md` em toda sessão. Copie a pasta `meu-harness/` para a
sua pasta pessoal (`~/meu-harness`) e ponha no `~/.claude/CLAUDE.md` uma linha só:

```text
@~/meu-harness/AGENTS.global.md
```

Abra uma sessão dentro de `consultorio/` e rode `/context`: em "Memory files" devem
aparecer os três arquivos (o `CLAUDE.md`, o `AGENTS.global.md` e o `AGENTS.md` do
projeto).

## Rodar o consultório (Python 3.12 ou mais recente)

```bash
cd consultorio
# Windows (PowerShell)
py -3.12 -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m pytest -q
.\.venv\Scripts\python -m uvicorn app.main:app --reload   # http://127.0.0.1:8000/docs

# macOS, Linux ou WSL: python3.12 -m venv .venv e .venv/bin/python no lugar
```

O expediente se cadastra com `PUT /profissionais/{id}/expediente`; sem ele, o
profissional não recebe consulta.

## A sua rodada vai sair diferente

As instruções fecham o que elas dizem, e só isso. Na rodada deste capítulo, o agente
seguiu o contrato de erros e rodou os testes, mas não mostrou a saída deles, e o mesmo
paciente continua podendo marcar duas consultas no mesmo horário (F03). Compare a sua
entrega com esta e com o diário, e anote no seu diário o que for seu.
