# Pedido

Status: aprovada (2026-10-25)

## Objetivo

Criar um pedido com itens e quantidades, aceito só dentro do horário (11h às 23h) e só com estoque para todos os itens, baixando o estoque e calculando o total com a taxa do bairro.

## Fatias (na ordem de implementação)

1. pedidos/criar-pedido: valida o corpo, o horário, o bairro, os itens e o estoque; grava o pedido, baixa o estoque e devolve o total (`POST /pedidos`).

Também: `pedidos/repositorio.ts`, `pedidos/dependencias.ts`, `pedidos/index.ts`, registro em `src/app.ts`, e as funções expostas nos `index.ts` dos outros módulos: `cardapio` (preço do item), `receitas` (receita do item), `estoque` (quantidade disponível e baixa de vários ingredientes de uma vez).

## Critérios de aceite

Pré-condição dos exemplos: item 1 `X-Burger` com preço 2250 e receita Pão 1 + Carne 150; item 2 `Refri` com preço 600 e receita Refrigerante 1; estoque: Pão (id 1) 10, Carne (id 2) 1000, Refrigerante (id 3) 5; bairro 1 `Centro` com taxa 500; relógio às 12:00 de Brasília, salvo quando dito o contrário.

- [x] `POST /pedidos` com `{ clienteId: 'ana@ex.com', bairroId: 1, itens: [{ itemId: 1, quantidade: 2 }, { itemId: 2, quantidade: 1 }] }` → 201 com `{ id: 1, clienteId: 'ana@ex.com', bairroId: 1, itens: [{ itemId: 1, quantidade: 2, precoUnitario: 2250 }, { itemId: 2, quantidade: 1, precoUnitario: 600 }], subtotal: 5100, taxa: 500, total: 5600 }`, itens em ordem de `itemId` (fatia 1)
- [x] Após esse pedido, o estoque é Pão 8, Carne 700, Refrigerante 4 (baixa pela receita × quantidade) (fatia 1)
- [x] `clienteId` com espaços (`'  ana@ex.com  '`) → 201 com `clienteId: 'ana@ex.com'` (aparado) (fatia 1)
- [x] Bairro de taxa 0 → 201 com `taxa: 0` e `total` igual ao `subtotal` (fatia 1)
- [x] Mesmo `itemId` em duas linhas de `itens` → 400 `{ erro: 'item repetido no pedido' }` e o estoque não muda (fatia 1)
- [x] Pedido às 10:59:59 → 409 `{ erro: 'fora do horário de funcionamento (11h às 23h)' }`; às 11:00:00 → 201; às 22:59:59 → 201; às 23:00:00 → 409 com a mesma mensagem; o estoque não muda nas recusas (fatia 1)
- [x] Pedido com `itemId: 1, quantidade: 11` (precisa de 11 Pães, há 10) → 409 `{ erro: 'estoque insuficiente de Pão' }` e o estoque não muda (fatia 1)
- [x] Pedido com item 1 (ok) e item 2 com quantidade 6 (há 5 Refrigerantes) → 409 `{ erro: 'estoque insuficiente de Refrigerante' }` e nada é baixado, nem o Pão e a Carne do item 1 (tudo ou nada) (fatia 1)
- [x] Dois itens que juntos pedem mais que o estoque (cada um sozinho cabe) → 409 `estoque insuficiente de <ingrediente>`: o consumo é somado antes de comparar (fatia 1)
- [x] `clienteId` ausente, que não é texto ou vazio/só espaços → 400 `{ erro: 'clienteId deve ser um texto não vazio' }` (fatia 1)
- [x] `bairroId` ausente, texto ou decimal → 400 `{ erro: 'bairroId deve ser um inteiro' }` (fatia 1)
- [x] `itens` ausente, que não é lista ou lista vazia → 400 `{ erro: 'pedido deve ter ao menos um item' }` (fatia 1)
- [x] `itemId` ausente, texto ou decimal em qualquer linha → 400 `{ erro: 'itemId deve ser um inteiro' }` (fatia 1)
- [x] `quantidade` ausente, texto, decimal, zero ou negativa em qualquer linha → 400 `{ erro: 'quantidade deve ser um inteiro positivo' }` (fatia 1)
- [x] `bairroId: 999` → 400 `{ erro: 'bairro 999 não encontrado' }` e o estoque não muda (fatia 1)
- [x] `itemId: 999` → 400 `{ erro: 'item 999 não encontrado' }` e o estoque não muda (fatia 1)
- [x] Item do cardápio sem receita definida → 400 `{ erro: 'item 3 não tem receita' }` e o estoque não muda (fatia 1)
- [x] Corpo que não é JSON válido ou não é objeto → 400 com a mesma resposta do padrão do `compartilhado/http.ts` (fatia 1)
- [x] Os ids dos pedidos são sequenciais (1, 2, ...) e um pedido recusado não consome id visível nem grava linha (fatia 1)

## Suposições

- Módulo novo `pedidos`, dono da regra; usa `cardapio`, `bairros`, `receitas` e `estoque` só pelos `index.ts` (regra de fronteira 1).
- Ordem das validações: formato do corpo (400) → horário (409) → bairro e itens inexistentes e itens sem receita (400) → estoque (409). O horário vem antes da existência porque independe do corpo, mas depois do formato, como nos outros módulos.
- Horário: aberto das 11:00:00 às 22:59:59 (23:00:00 já recusa), no fuso `America/Sao_Paulo`, fixo no código. O relógio entra pela `Dependencias` (função que devolve a hora atual), para os testes controlarem o horário. (Perguntas sobre cliente, item sem receita e limite do horário ficaram sem resposta; adotei as opções recomendadas.)
- `clienteId` é texto não vazio, aparado, sem tamanho máximo nem formato; não há cadastro de clientes. Fica gravado já agora para a F7 (cupom uma vez por cliente) não precisar mudar o formato do pedido.
- Valores em centavos inteiros. `precoUnitario` é o preço do cardápio no momento do pedido e fica gravado no pedido (mudanças futuras de preço não alteram pedidos antigos). `subtotal` = soma de `precoUnitario × quantidade`; `taxa` = taxa do bairro no momento; `total` = `subtotal + taxa`. A taxa também fica gravada.
- Item sem receita é recusado (400), pois não há como saber o que baixar.
- Estoque: consumo de cada ingrediente = soma de `quantidade da receita × quantidade pedida` em todos os itens; o pedido só é aceito se, para cada ingrediente, a quantidade em estoque for maior ou igual ao consumo total (estoque igual ao consumo é aceito, deixando zero). A mensagem cita o primeiro ingrediente insuficiente, por `ingredienteId` crescente.
- Atomicidade: checagem, baixa e gravação do pedido acontecem numa transação do mesmo banco SQLite (`node:sqlite`, síncrono): ou tudo, ou nada.
- Status do pedido: todo pedido criado já está confirmado (baixa feita na criação); não há fluxo de pagamento, rascunho nem cancelamento.
- Erro de validação 400, recusa por regra de negócio (horário, estoque) 409, sucesso 201, no padrão dos outros módulos.
- Id do pedido inteiro autoincrementado.

## Fora do escopo

- Cupom e desconto no pedido (F7); o campo `desconto` entra na F7.
- Consultar ou listar pedidos (F8).
- Cancelar pedido e devolver estoque, editar pedido.
- Pagamento, endereço completo, observações do pedido, status de entrega.
- Cadastro de clientes e validação do formato do `clienteId`.
- Horário configurável, feriados, fusos diferentes.
- Limite de itens ou de quantidade por pedido.
