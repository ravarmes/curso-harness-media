# Capítulo 1: o consultório sem harness

Esta branch é o estado do código no fim da prática guiada do capítulo 1.

| Pasta | O que tem |
|---|---|
| `meu-harness/` | O esqueleto do seu harness, ainda vazio, e o `diario-de-falhas.md` com as falhas da rodada |
| `consultorio/` | A API que o agente entregou para o pedido vago do capítulo, **exatamente como saiu**, sem nenhuma correção |

O consultório desta branch não é um exemplo a seguir. Ele é a linha de base: o que um
agente faz sozinho, sem harness. As falhas dele estão no diário, com a evidência de
cada uma, e os próximos capítulos vão fechá-las, uma a uma.

## Rodar o consultório (Python 3.12 ou mais recente)

```bash
cd consultorio
python -m venv .venv
# Windows (PowerShell):   .\.venv\Scripts\pip install -r requirements.txt
# macOS, Linux ou WSL:    .venv/bin/pip install -r requirements.txt
python -m pytest -q                     # use o python do .venv
python -m uvicorn app.main:app --reload # API em http://127.0.0.1:8000/docs
```

## A sua rodada vai sair diferente

O agente não responde igual duas vezes. Nas duas rodadas que fizemos com o mesmo
pedido, uma pôs tudo num arquivo e a outra separou as regras; uma respondeu 409 ao
cancelamento fora do prazo e a outra, 422. Compare a sua entrega com esta e com o diário,
e anote no seu diário as falhas que forem suas.
