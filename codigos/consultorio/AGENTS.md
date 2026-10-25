# Consultório: API da agenda

## Comandos
- `.venv\Scripts\python -m pytest -q` (no Windows; `.venv/bin/python` nos
  outros sistemas): os testes. Rode antes de dizer que terminou e mostre
  a saída.
- `.venv\Scripts\python -m uvicorn app.main:app --reload`: sobe a API em
  http://127.0.0.1:8000 (documentação interativa em /docs).

## Regras que o código não mostra
- Código de erro: 404 quando o recurso não existe; 409 quando uma regra de
  negócio recusa o pedido (horário ocupado, fora do prazo); 422 quando o
  dado vem malformado, que o FastAPI já faz. O corpo é sempre
  {"detail": "<mensagem em português>"}. Motivo: o cliente decide o que
  fazer pelo código, então o mesmo caso não pode ter dois códigos.
- Horário sem fuso é horário de Brasília (America/Sao_Paulo); o banco
  guarda UTC. Motivo: o consultório atende num fuso só.

## Decisões que não se reabrem
- Python, FastAPI e SQLite (outubro de 2026): é o que o projeto já usa.
  Não proponha trocar de linguagem nem de framework.
