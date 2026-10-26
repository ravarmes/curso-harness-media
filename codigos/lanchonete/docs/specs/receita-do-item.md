# Receita do item

Status: aprovada (2026-10-25)

## Objetivo

Definir e consultar quais ingredientes do estoque, e em que quantidade, cada item do cardápio consome.

## Fatias (na ordem de implementação)

1. receitas/definir-receita: valida a lista de ingredientes e substitui a receita inteira do item (`PUT /cardapio/:id/receita`).
2. receitas/consultar-receita: devolve a receita de um item (`GET /cardapio/:id/receita`).

Também: `receitas/repositorio.ts`, `receitas/index.ts`, registro em `src/app.ts`, e uma função de existência exposta no `index.ts` de `cardapio` (item existe?) e de `estoque` (ingrediente existe e qual o nome?), usadas por `receitas`.

## Critérios de aceite

Pré-condição dos exemplos: item 1 `X-Burger` no cardápio; ingredientes 1 `Pão` e 2 `Carne (g)` no estoque.

- [x] `PUT /cardapio/1/receita` com `{ ingredientes: [{ ingredienteId: 1, quantidade: 1 }, { ingredienteId: 2, quantidade: 150 }] }` → 200 com `{ itemId: 1, ingredientes: [{ ingredienteId: 1, nome: 'Pão', quantidade: 1 }, { ingredienteId: 2, nome: 'Carne (g)', quantidade: 150 }] }`, em ordem de `ingredienteId` (fatia 1)
- [x] Segundo `PUT` com `{ ingredientes: [{ ingredienteId: 2, quantidade: 200 }] }` → 200 e a receita passa a ter só a Carne com 200 (substitui, não soma) (fatia 1)
- [x] `PUT /cardapio/1/receita` sem `ingredientes`, com valor que não é lista, ou com lista vazia → 400 `{ erro: 'receita deve ter ao menos um ingrediente' }` e a receita anterior não muda (fatia 1)
- [x] `PUT` com `quantidade` ausente, texto, decimal (`1.5`), zero ou negativa em qualquer ingrediente → 400 `{ erro: 'quantidade deve ser um inteiro positivo' }` e a receita anterior não muda (fatia 1)
- [x] `PUT` com `ingredienteId` ausente, texto ou decimal → 400 `{ erro: 'ingredienteId deve ser um inteiro' }` (fatia 1)
- [x] `PUT` com o mesmo `ingredienteId` duas vezes → 400 `{ erro: 'ingrediente repetido na receita' }` (fatia 1)
- [x] `PUT` com `ingredienteId: 999` → 400 `{ erro: 'ingrediente 999 não encontrado' }` e a receita anterior não muda (fatia 1)
- [x] `PUT /cardapio/999/receita` ou `/cardapio/abc/receita` com corpo válido → 404 `{ erro: 'item não encontrado' }` (fatia 1)
- [ ] `GET /cardapio/1/receita` após o primeiro `PUT` → 200 com a mesma receita, com o nome atual dos ingredientes (fatia 2)
- [ ] `GET /cardapio/1/receita` de item existente sem receita definida → 200 `{ itemId: 1, ingredientes: [] }` (fatia 2)
- [ ] `GET /cardapio/999/receita` ou `/cardapio/abc/receita` → 404 `{ erro: 'item não encontrado' }` (fatia 2)

## Suposições

- Módulo novo `receitas`, dono da regra; usa `cardapio` e `estoque` só pelos `index.ts` (regra de fronteira 1). Dois módulos existentes não ficam acoplados entre si, e a F6 consulta `receitas` para baixar o estoque.
- Definir é substituir a receita inteira (`PUT`, idempotente); não há adicionar/remover ingrediente isolado.
- Quantidade é inteira positiva, na unidade do nome do ingrediente (`Carne (g)`), como no estoque.
- Receita precisa de ao menos um ingrediente; item sem receita devolve lista vazia no `GET` (não 404).
- Validação do corpo (400) vem antes da checagem de existência do item (404), como no padrão do módulo `estoque`. Ingrediente inexistente é 400 (erro no corpo), item inexistente é 404 (recurso da URL).
- Substituição é atômica: se qualquer ingrediente é inválido, a receita anterior permanece.
- A resposta traz o `nome` do ingrediente lido do estoque no momento da consulta, não gravado na receita.
- Id e rotas seguem o padrão: erro de validação 400, ausência 404, sucesso do `PUT` 200.

## Fora do escopo

- Baixa de estoque e verificação de disponibilidade (F6); o `index.ts` de `receitas` fica sem API para outros módulos até a F6 precisar.
- Remover receita, remover ingrediente isolado, editar item ou ingrediente.
- Custo do item calculado pela receita, unidades de medida e rendimento.
- Paginação.
