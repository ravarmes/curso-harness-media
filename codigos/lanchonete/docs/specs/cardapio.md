# Cardápio

Status: aprovada (2026-10-25)

## Objetivo

Cadastrar, listar e consultar itens do cardápio, cada um com nome e preço.

## Fatias (na ordem de implementação)

1. cardapio/cadastrar-item: valida nome e preço e grava o item (`POST /cardapio`).
2. cardapio/listar-itens: devolve todos os itens, por id crescente (`GET /cardapio`).
3. cardapio/consultar-item: devolve um item pelo id (`GET /cardapio/:id`).

Também: `cardapio/repositorio.ts`, `cardapio/index.ts` e registro em `src/app.ts`.

## Critérios de aceite

- [x] `POST /cardapio` com `{ nome: 'X-Burger', preco: 2250 }` → 201 com `{ id: 1, nome: 'X-Burger', preco: 2250 }` (fatia 1)
- [x] `POST /cardapio` com `{ nome: '  X-Burger  ', preco: 2250 }` → 201 com `nome: 'X-Burger'` (espaços aparados) (fatia 1)
- [x] `POST /cardapio` sem `nome`, com `nome` vazio ou só espaços → 400 `{ erro: 'nome obrigatório' }` (fatia 1)
- [x] `POST /cardapio` com `nome` de 81 caracteres → 400 `{ erro: 'nome com mais de 80 caracteres' }` (fatia 1)
- [x] `POST /cardapio` com `preco` ausente, texto, decimal (`10.5`), zero ou negativo → 400 `{ erro: 'preço deve ser um inteiro positivo, em centavos' }` (fatia 1)
- [x] `POST /cardapio` com nome já cadastrado (ignorando maiúsculas/minúsculas, ex.: `x-burger`) → 409 `{ erro: 'já existe um item com esse nome' }` (fatia 1)
- [ ] `GET /cardapio` com banco vazio → 200 `[]` (fatia 2)
- [ ] `GET /cardapio` após cadastrar dois itens → 200 com os dois, em ordem de id (fatia 2)
- [ ] `GET /cardapio/1` de item existente → 200 com `{ id: 1, nome, preco }` (fatia 3)
- [ ] `GET /cardapio/999` inexistente → 404 `{ erro: 'item não encontrado' }` (fatia 3)
- [ ] `GET /cardapio/abc` → 404 `{ erro: 'item não encontrado' }` (fatia 3)

## Suposições

- Preço em centavos, inteiro (evita erro de ponto flutuante nas contas de total e desconto das F6/F7).
- Nome até 80 caracteres, aparado; nome único sem distinguir maiúsculas/minúsculas, para não duplicar itens no cardápio.
- Erro de validação é 400, duplicidade é 409, ausência é 404, como no padrão do módulo `notas`.
- Id é inteiro autoincrementado pelo SQLite.
- Sem moeda no payload: o sistema é em reais.

## Fora do escopo

- Editar, remover ou desativar itens.
- Categorias, descrição, foto e disponibilidade.
- Paginação da listagem.
- Receita/ingredientes do item (F3).
