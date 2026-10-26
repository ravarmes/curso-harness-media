# Cupons

Status: aprovada (2026-10-25)

## Objetivo

Cadastrar cupons de desconto percentual e consultar um cupom pelo código.

## Fatias (na ordem de implementação)

1. cupons/cadastrar-cupom: valida código e percentual e grava o cupom (`POST /cupons`).
2. cupons/consultar-cupom: devolve um cupom pelo código (`GET /cupons/:codigo`).

Também: `cupons/repositorio.ts`, `cupons/index.ts` e registro em `src/app.ts`.

## Critérios de aceite

- [x] `POST /cupons` com `{ codigo: 'BEMVINDO10', percentual: 10 }` → 201 com `{ id: 1, codigo: 'BEMVINDO10', percentual: 10 }` (fatia 1)
- [x] `POST /cupons` com `{ codigo: '  bemvindo10  ', percentual: 100 }` → 201 com `codigo: 'BEMVINDO10'` (aparado e em maiúsculas) e `percentual: 100` (fatia 1)
- [x] `POST /cupons` sem `codigo`, com `codigo` vazio ou só espaços → 400 `{ erro: 'código obrigatório' }` (fatia 1)
- [x] `POST /cupons` com `codigo` de 31 caracteres → 400 `{ erro: 'código com mais de 30 caracteres' }` (fatia 1)
- [x] `POST /cupons` com `codigo` contendo caracteres fora de letras, números e hífen (ex.: `DEZ POR CENTO`) → 400 `{ erro: 'código aceita só letras, números e hífen' }` (fatia 1)
- [x] `POST /cupons` com `percentual` ausente, texto, decimal (`7.5`), `0`, negativo ou `101` → 400 `{ erro: 'percentual deve ser um inteiro de 1 a 100' }` (fatia 1)
- [x] `POST /cupons` com código já cadastrado (ignorando maiúsculas/minúsculas, ex.: `bemvindo10`) → 409 `{ erro: 'já existe um cupom com esse código' }` e o percentual do cupom original não muda (fatia 1)
- [ ] `GET /cupons/BEMVINDO10` de cupom existente → 200 com `{ id: 1, codigo: 'BEMVINDO10', percentual: 10 }` (fatia 2)
- [ ] `GET /cupons/bemvindo10` (minúsculas) → 200 com o mesmo cupom (fatia 2)
- [ ] `GET /cupons/INEXISTENTE` → 404 `{ erro: 'cupom não encontrado' }` (fatia 2)

## Suposições

- Desconto só percentual, inteiro de 1 a 100, aplicado sobre os itens (a F7 define o cálculo). (Pergunta ficou sem resposta; adotei a opção recomendada.)
- Cupom sem validade: vale até ser removido; o limite de uso é a regra "uma vez por cliente" da F7. (Idem.)
- Código aparado, convertido para maiúsculas, até 30 caracteres, só letras sem acento, números e hífen; único. A consulta também normaliza para maiúsculas.
- Consulta pelo código (é o que o cliente digita), não pelo id. Sem listagem: o pedido não a cita.
- Erro de validação é 400, duplicidade é 409, ausência é 404; validação do corpo precede a checagem de duplicidade.
- Id é inteiro autoincrementado pelo SQLite.
- O `index.ts` expõe só o que a F7 vai precisar (buscar um cupom pelo código); a F7 define o uso.

## Fora do escopo

- Editar, desativar ou remover cupom; desconto em valor fixo; validade.
- Aplicar o cupom no pedido e a regra de uma vez por cliente (F7).
- Listagem de cupons e paginação.
