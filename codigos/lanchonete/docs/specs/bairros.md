# Bairros

Status: aprovada (2026-10-25)

## Objetivo

Cadastrar bairros com a taxa de entrega e consultar a taxa.

## Fatias (na ordem de implementação)

1. bairros/cadastrar-bairro: valida nome e taxa e grava o bairro (`POST /bairros`).
2. bairros/listar-bairros: devolve todos os bairros, por id crescente (`GET /bairros`).
3. bairros/consultar-bairro: devolve um bairro, com a taxa, pelo id (`GET /bairros/:id`).

Também: `bairros/repositorio.ts`, `bairros/index.ts` e registro em `src/app.ts`.

## Critérios de aceite

- [x] `POST /bairros` com `{ nome: 'Centro', taxa: 500 }` → 201 com `{ id: 1, nome: 'Centro', taxa: 500 }` (fatia 1)
- [x] `POST /bairros` com `{ nome: '  Vila Nova  ', taxa: 0 }` → 201 com `nome: 'Vila Nova'` e `taxa: 0` (fatia 1)
- [x] `POST /bairros` sem `nome`, com `nome` vazio ou só espaços → 400 `{ erro: 'nome obrigatório' }` (fatia 1)
- [x] `POST /bairros` com `nome` de 81 caracteres → 400 `{ erro: 'nome com mais de 80 caracteres' }` (fatia 1)
- [x] `POST /bairros` com `taxa` ausente, texto, decimal (`5.5`) ou negativa (`-1`) → 400 `{ erro: 'taxa deve ser um inteiro maior ou igual a zero, em centavos' }` (fatia 1)
- [x] `POST /bairros` com nome já cadastrado (ignorando maiúsculas/minúsculas, ex.: `centro`) → 409 `{ erro: 'já existe um bairro com esse nome' }` e a taxa do bairro original não muda (fatia 1)
- [x] `GET /bairros` com banco vazio → 200 `[]` (fatia 2)
- [x] `GET /bairros` após cadastrar dois bairros → 200 com os dois, em ordem de id (fatia 2)
- [x] `GET /bairros/1` de bairro existente → 200 com `{ id: 1, nome: 'Centro', taxa: 500 }` (fatia 3)
- [x] `GET /bairros/999` ou `/bairros/abc` → 404 `{ erro: 'bairro não encontrado' }` (fatia 3)

## Suposições

- Taxa é inteiro em centavos, como o preço no cardápio; aceita 0 (entrega grátis). (Pergunta sobre taxa zero ficou sem resposta; adotei a opção recomendada.)
- Consulta por id e listagem, no padrão de `cardapio` e `estoque`. (Idem.)
- Nome até 80 caracteres, aparado; único sem distinguir maiúsculas/minúsculas.
- Erro de validação é 400, duplicidade é 409, ausência é 404; validação do corpo precede a checagem de duplicidade.
- Id é inteiro autoincrementado pelo SQLite.
- O `index.ts` expõe só o que a F6 vai precisar (buscar a taxa de um bairro pelo id); a F6 define o uso.

## Fora do escopo

- Editar bairro ou taxa, remover bairro.
- Uso da taxa no pedido (F6).
- Paginação da listagem.
