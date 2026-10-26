# Cupom no pedido

Status: aprovada (2026-10-25)

## Objetivo

Aceitar um código de cupom opcional em `POST /pedidos`, descontando o percentual do cupom do subtotal, com cada cupom valendo uma única vez por cliente.

## Fatias (na ordem de implementação)

1. pedidos/criar-pedido: aceita `cupom` opcional no corpo, valida o código e o uso anterior pelo cliente, calcula e grava o `desconto` e o cupom usado, e devolve o total com desconto (`POST /pedidos`).

Também: `pedidos/dependencias.ts` (dependência `cupomPorCodigo`, campos `desconto` e `cupom` no `Pedido`), `pedidos/repositorio.ts` (colunas `desconto` e `cupom_id`, consulta de uso anterior), `pedidos/index.ts` e `src/app.ts` (entrega `cupomPorCodigo` vindo do `index.ts` de `cupons`).

## Critérios de aceite

Pré-condição dos exemplos: a mesma da F6 (item 1 `X-Burger` 2250, item 2 `Refri` 600, estoque suficiente, bairro 1 com taxa 500, 12:00 de Brasília), mais os cupons `BEMVINDO10` (10%) e `TUDO` (100%).

- [x] `POST /pedidos` com o pedido da F6 (2 × item 1 + 1 × item 2, subtotal 5100) e `cupom: 'BEMVINDO10'` → 201 com `cupom: 'BEMVINDO10'`, `subtotal: 5100`, `desconto: 510`, `taxa: 500`, `total: 5090` (total = subtotal − desconto + taxa) (fatia 1)
- [x] `cupom: '  bemvindo10  '` → 201 com `cupom: 'BEMVINDO10'` (aparado e em maiúsculas, como na consulta de cupons) (fatia 1)
- [x] Pedido sem o campo `cupom` → 201 com `cupom: null`, `desconto: 0` e `total` igual ao da F6 (`subtotal + taxa`) (fatia 1)
- [x] Desconto arredondado para baixo: subtotal 2250 (1 × item 1) com cupom de 15% → `desconto: 337` (e não 338), `total: 2250 − 337 + 500 = 2413` (fatia 1)
- [x] Cupom `TUDO` (100%) → `desconto` igual ao `subtotal` e `total` igual à `taxa` (500); a taxa não é descontada (fatia 1)
- [x] O desconto incide só sobre os itens: com `BEMVINDO10` e bairro de taxa 0 → `total = subtotal − desconto`; com taxa 500 o `desconto` é o mesmo (fatia 1)
- [x] Mesmo cliente usa `BEMVINDO10` de novo, em outro pedido válido → 409 `{ erro: 'cupom já usado por este cliente' }`, o estoque não muda e nenhum pedido é gravado (fatia 1)
- [x] Outro cliente (`bia@ex.com`) usa `BEMVINDO10` → 201 com desconto (o limite é por cliente) (fatia 1)
- [x] O mesmo cliente usa outro cupom (`TUDO`) depois de ter usado `BEMVINDO10` → 201 (o limite é por cupom) (fatia 1)
- [x] O mesmo cliente faz um segundo pedido sem cupom depois de usar `BEMVINDO10` → 201 (fatia 1)
- [x] Cliente cujo pedido com `BEMVINDO10` foi recusado (por estoque insuficiente, horário ou item inexistente) → o cupom não é consumido: o pedido seguinte válido com o mesmo cupom → 201 com desconto (fatia 1)
- [x] `cupom: 'INEXISTENTE'` → 400 `{ erro: 'cupom INEXISTENTE não encontrado' }` e o estoque não muda (fatia 1)
- [x] `cupom` que não é texto (número, objeto, lista, `null`) ou texto vazio/só espaços → 400 `{ erro: 'cupom deve ser um texto não vazio' }` (fatia 1)
- [x] O `clienteId` é comparado já aparado: `'  ana@ex.com  '` depois de `'ana@ex.com'` usando o mesmo cupom → 409 `cupom já usado por este cliente` (fatia 1)
- [x] Ordem das validações inalterada para o que já existia (formato → horário → bairro/itens/receita), seguida de cupom (existência → uso anterior) e, por último, estoque: pedido às 10:59 com cupom inexistente → 409 de horário; cupom já usado com estoque insuficiente → 409 `cupom já usado por este cliente` (fatia 1)

## Suposições

- Campo novo opcional `cupom` (o código) no corpo. A resposta passa a trazer sempre `desconto` (inteiro em centavos, 0 sem cupom) e `cupom` (código normalizado ou `null`). Os testes da F6 que comparam o corpo inteiro serão atualizados para os dois campos novos; os valores antigos não mudam.
- Desconto = `floor(subtotal × percentual / 100)`, em centavos inteiros, sobre o subtotal dos itens; a taxa de entrega não é descontada. `total = subtotal − desconto + taxa`. O percentual do cupom no momento do pedido vale para ele (guardamos o `desconto` calculado, não o percentual).
- Arredondar para baixo evita fração de centavo e nunca desconta mais que o percentual; é a escolha mais simples e previsível.
- Código do cupom normalizado como na consulta de cupons: aparado e em maiúsculas.
- "Uma vez por cliente" = um pedido aceito por par (`clienteId`, cupom). `clienteId` é comparado como gravado (aparado, diferenciando maiúsculas de minúsculas), sem cadastro de clientes. Só pedido criado conta; recusa não consome o cupom.
- A marca de uso é o próprio pedido gravado (coluna `cupom_id` em `pedidos`) com um índice único parcial em (`cliente_id`, `cupom_id`) como garantia do banco; a gravação do pedido e a baixa do estoque seguem na mesma transação.
- Erro de formato e cupom inexistente são 400 (padrão do bairro/item inexistente); cupom já usado é 409 (recusa por regra de negócio), como horário e estoque.
- Ordem: o cupom é validado depois de bairro e itens e antes do estoque, para que o cliente veja o erro do cupom antes do de estoque, e a mensagem de horário continue vindo primeiro.
- Banco já existente (`dados.sqlite` da F6) não recebe as colunas novas só com `CREATE TABLE IF NOT EXISTS`: o repositório acrescenta `desconto` e `cupom_id` com `ALTER TABLE` se faltarem. Pedidos antigos ficam com `desconto 0` e sem cupom.
- Sem dependência nova; a dependência `cupomPorCodigo` vem do `index.ts` de `cupons`, que já a expõe.

## Fora do escopo

- Consultar pedido (F8); a F8 vai ler `desconto` e `cupom` gravados aqui.
- Cupom de valor fixo, validade, limite global de usos, valor mínimo do pedido, cupom em mais de um por pedido.
- Devolver o cupom ao cliente ao cancelar pedido (não existe cancelamento).
- Normalizar o `clienteId` (e-mail em minúsculas, por exemplo).
- Rota separada para validar cupom antes de pedir.
