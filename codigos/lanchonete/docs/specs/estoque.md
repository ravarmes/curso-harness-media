# Estoque

Status: aprovada (2026-10-25)

## Objetivo

Cadastrar ingredientes com quantidade em estoque, repor a quantidade e consultar o estoque.

## Fatias (na ordem de implementação)

1. estoque/cadastrar-ingrediente: valida nome e quantidade inicial e grava o ingrediente (`POST /estoque`).
2. estoque/repor-ingrediente: soma uma quantidade ao estoque de um ingrediente (`POST /estoque/:id/reposicao`).
3. estoque/listar-estoque: devolve todos os ingredientes, por id crescente (`GET /estoque`).
4. estoque/consultar-ingrediente: devolve um ingrediente pelo id (`GET /estoque/:id`).

Também: `estoque/repositorio.ts`, `estoque/index.ts` e registro em `src/app.ts`.

## Critérios de aceite

- [x] `POST /estoque` com `{ nome: 'Carne (g)', quantidade: 500 }` → 201 com `{ id: 1, nome: 'Carne (g)', quantidade: 500 }` (fatia 1)
- [x] `POST /estoque` com `{ nome: '  Pão  ', quantidade: 0 }` → 201 com `nome: 'Pão'` e `quantidade: 0` (fatia 1)
- [x] `POST /estoque` sem `nome`, com `nome` vazio ou só espaços → 400 `{ erro: 'nome obrigatório' }` (fatia 1)
- [x] `POST /estoque` com `nome` de 81 caracteres → 400 `{ erro: 'nome com mais de 80 caracteres' }` (fatia 1)
- [x] `POST /estoque` com `quantidade` ausente, texto, decimal (`1.5`) ou negativa (`-1`) → 400 `{ erro: 'quantidade deve ser um inteiro maior ou igual a zero' }` (fatia 1)
- [x] `POST /estoque` com nome já cadastrado (ignorando maiúsculas/minúsculas, ex.: `carne (G)`) → 409 `{ erro: 'já existe um ingrediente com esse nome' }` (fatia 1)
- [x] `POST /estoque/1/reposicao` com `{ quantidade: 100 }` sobre ingrediente com 500 → 200 com `{ id: 1, nome: 'Carne (g)', quantidade: 600 }` (fatia 2)
- [x] Duas reposições seguidas (100 e 50) sobre ingrediente com 0 → quantidade final 150 (fatia 2)
- [x] `POST /estoque/1/reposicao` com `quantidade` ausente, texto, decimal, zero ou negativa → 400 `{ erro: 'quantidade deve ser um inteiro positivo' }` e o estoque não muda (fatia 2)
- [x] `POST /estoque/999/reposicao` ou `/estoque/abc/reposicao` → 404 `{ erro: 'ingrediente não encontrado' }` (fatia 2)
- [ ] `GET /estoque` com banco vazio → 200 `[]` (fatia 3)
- [ ] `GET /estoque` após cadastrar dois ingredientes → 200 com os dois, em ordem de id (fatia 3)
- [ ] `GET /estoque/1` de ingrediente existente → 200 com `{ id: 1, nome, quantidade }` refletindo reposições (fatia 4)
- [ ] `GET /estoque/999` ou `/estoque/abc` → 404 `{ erro: 'ingrediente não encontrado' }` (fatia 4)

## Suposições

- Quantidade é inteira, sem campo de unidade; a unidade vai no nome (`Carne (g)`). Evita erro de ponto flutuante nas baixas da F6.
- Cadastro aceita quantidade inicial 0 (ingrediente previsto, ainda sem estoque); reposição exige inteiro > 0.
- Nome até 80 caracteres, aparado; único sem distinguir maiúsculas/minúsculas, como no cardápio.
- "Repor" soma à quantidade atual. Reposição devolve 200 (altera recurso existente), não 201.
- Reposição é `POST /estoque/:id/reposicao`, pois é uma ação, não substituição do recurso.
- Erro de validação é 400, duplicidade é 409, ausência é 404, como no módulo `cardapio`.
- Id é inteiro autoincrementado pelo SQLite.
- Validação de quantidade precede a checagem de existência do ingrediente? Não: ingrediente inexistente (404) é checado depois da validação do corpo, como no padrão do módulo (primeiro valida entrada).

## Fora do escopo

- Editar nome, remover ingrediente, ou reduzir/ajustar estoque manualmente.
- Baixa de estoque por pedido (F6) e receitas (F3); o `index.ts` não expõe nada para outros módulos ainda.
- Unidades de medida, estoque mínimo e alertas.
- Paginação da listagem.
