# Consultório: API da agenda

## Comandos

- Na primeira vez: `npm install` (Node.js 22.18 ou mais recente).
- `npm run dev`: sobe a API em http://localhost:3000 e reinicia ao salvar.
- `npm run verify`: tipos, testes e teste de arquitetura. Rode antes de
  dizer que terminou e mostre a saída.
- `npm run provedor`: sobe o provedor falso de WhatsApp em
  http://127.0.0.1:4010. Ele lê o `WHATSAPP_TOKEN` do `.env`, que não vai
  para o Git; as variáveis estão no `.env.exemplo`.

## Arquitetura

- Monólito modular em fatias verticais. Antes de criar ou mover arquivos
  em `src/`, leia `docs/arquitetura.md`.
- Se o teste de arquitetura reprovar, corrija o código, não o teste.

## Regras que o código não mostra

- Código de erro: 400 quando o dado vem malformado ou faltando; 404 quando
  o recurso não existe (inclusive paciente ou profissional citado no
  corpo); 409 quando uma regra de negócio recusa o pedido (horário ocupado,
  fora do expediente, fora do prazo). O corpo é sempre
  {"erro": "<mensagem em português>"}. Motivo: o cliente decide o que
  fazer pelo código, então o mesmo caso não pode ter dois códigos.
- Horário chega em ISO 8601 com offset (2026-11-10T14:00:00-03:00); sem
  offset, 400. O banco guarda UTC, e tudo o que fala de "dia" usa a data de
  Brasília (America/Sao_Paulo). Motivo: o consultório atende num fuso só.

## Decisões que não se reabrem

- TypeScript no modelo de projeto do harness (outubro de 2026): o
  consultório antigo, em Python, foi refeito aqui. Não proponha voltar.
- Sem framework HTTP nem ORM: o roteador mínimo fica em
  `src/compartilhado/http.ts` e o banco é o `node:sqlite`. Menos
  dependências, menos código para o agente ler. Não proponha trocar.
- Node.js 22.18 ou mais recente roda o TypeScript direto, sem build. Não
  use `enum`, `namespace` nem propriedades no construtor: o Node não as
  executa sem compilação (o `tsc` acusa).
