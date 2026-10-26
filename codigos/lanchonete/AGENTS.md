# lanchonete

## Comandos

- Na primeira vez: `npm install` (Node.js 22.18 ou mais recente).
- `npm run dev`: sobe a API em http://localhost:3000 e reinicia ao salvar.
- `npm run verify`: tipos, testes e teste de arquitetura. Rode antes de
  dizer que terminou e mostre a saída.

## Arquitetura

- Monólito modular em fatias verticais. Antes de criar ou mover arquivos
  em `src/`, leia `docs/arquitetura.md`.
- Se o teste de arquitetura reprovar, corrija o código, não o teste.

## Decisões que não se reabrem

- Sem framework HTTP nem ORM: o roteador mínimo fica em
  `src/compartilhado/http.ts` e o banco é o `node:sqlite`. Menos
  dependências, menos código para o agente ler. Não proponha trocar.
- Node.js 22.18 ou mais recente roda o TypeScript direto, sem build. Não
  use `enum`, `namespace` nem propriedades no construtor: o Node não as
  executa sem compilação (o `tsc` acusa).
