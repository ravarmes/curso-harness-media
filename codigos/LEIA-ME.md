# Projeto final: a lanchonete

Esta branch é o estado do código no fim do projeto final do curso. Ela parte da `cap-08`, com o
harness completo (instalado como plugin nas rodadas), e acrescenta `lanchonete/`, uma API de
pedidos criada do zero a partir de um pedido só:

> Quero uma API para os pedidos de uma lanchonete. Ela tem um cardápio com preços e o
> estoque dos ingredientes de cada item. Um pedido tem itens e quantidades, e só é aceito
> se houver estoque para todos eles; ao confirmar, o estoque baixa. O cliente pode usar
> um cupom de desconto, que vale uma vez por cliente. A taxa de entrega depende do
> bairro, e só se fazem pedidos dentro do horário de funcionamento, das 11h às 23h.

Todos os commits de `lanchonete/` são **do próprio agente**, com o autor "Aluno do curso" e as
mensagens dele:

| Commits | Sessão | O que entra |
|---|---|---|
| 1 e 2 | 0 | A `iniciar-projeto` cria o projeto do modelo e divide o pedido em 8 funcionalidades (`docs/funcionalidades.json`) |
| 3 a 7 | 1 | F1, cardápio (com uma segunda revisão, depois de o revisor pedir os testes das rotas) |
| 8 a 23 | 2 a 7 | F2 estoque, F3 receita do item, F4 bairros, F5 cupons, F6 pedido, F7 cupom no pedido |

A F8 (consultar um pedido) continua com `"passa": false`: é a próxima sessão. O guia do
capítulo 8, com a instalação do harness como plugin, está na branch `cap-08`.

## Rodar a lanchonete (Node.js 22.18 ou mais recente)

```bash
cd lanchonete
npm install          # na primeira vez
npm run verify       # tipos, testes e teste de arquitetura
npm run dev          # API em http://localhost:3000
```

Valores em centavos inteiros. Rotas: `POST /cardapio`, `GET /cardapio`, `GET /cardapio/:id`,
`PUT /cardapio/:id/receita`, `GET /cardapio/:id/receita`, `POST /estoque`, `GET /estoque`,
`GET /estoque/:id`, `POST /estoque/:id/reposicao`, `POST /bairros`, `GET /bairros`,
`GET /bairros/:id`, `POST /cupons`, `GET /cupons/:codigo` e `POST /pedidos`. Fora das 11h às 23h
(horário de Brasília), o pedido responde 409.

## A sua rodada vai sair diferente

Repare em três coisas na sua. A lista saiu em ordem de dependência, e cada sessão fez uma
funcionalidade só? As armadilhas do pedido (dinheiro com casas decimais, dois itens que usam o
mesmo ingrediente, cupom reaproveitado, o pedido às 23h em ponto) apareceram nos critérios de
aceite, ou só depois, nos sensores? E o diário: que falha nova o projeto mostrou?
