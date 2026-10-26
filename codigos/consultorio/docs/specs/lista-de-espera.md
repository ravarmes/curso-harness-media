# Lista de espera

Status: aprovada (2026-10-25)

## Objetivo

O paciente entra na fila de espera de um profissional para um dia (de Brasília), pode sair dela, e a recepção consulta a fila em ordem de chegada.

## Fatias (na ordem de implementação)

1. espera/entrar-na-lista: módulo novo `espera` (repositório com a tabela `lista_de_espera`, `index.ts` e registro em `src/app.ts`) e a rota `POST /lista-de-espera`, com corpo `{ paciente_id, profissional_id, data }` (`data` = AAAA-MM-DD, dia de Brasília). Responde 201 `{ id, paciente_id, profissional_id, data, entrou_em }`, com `entrou_em` em ISO 8601 de Brasília. Usa `pacientes` e `profissionais` só pelo `index.ts` (`existe`).
2. espera/sair-da-lista: `DELETE /lista-de-espera/:id`. Remove a entrada e responde 200 com a entrada removida (`{ id, paciente_id, profissional_id, data, entrou_em }`).
3. espera/consultar-lista: `GET /profissionais/:id/lista-de-espera/:data`. Responde 200 `{ profissional_id, data, fila: [{ posicao, id, paciente_id, entrou_em }] }`, em ordem de chegada, `posicao` a partir de 1.

## Critérios de aceite

Pacientes P1, P2 e profissionais A, B cadastrados; hoje é 2026-10-25 em Brasília.

- [x] P1 entra na fila de A para 2026-11-10 → 201 com `id`, `paciente_id`, `profissional_id: A`, `data: '2026-11-10'` e `entrou_em` com offset -03:00 (fatia 1)
- [x] a data de hoje (2026-10-25) é aceita → 201 (fatia 1)
- [x] P1 entra de novo na fila de A para 2026-11-10 → 409 `{ erro: 'O paciente já está na lista de espera deste profissional neste dia' }` (fatia 1)
- [x] P1 entra na fila de A para 2026-11-11, e na de B para 2026-11-10 → 201 nos dois (a duplicidade é por paciente, profissional e dia) (fatia 1)
- [x] `data` ontem (2026-10-24) → 409 `{ erro: 'A data da lista de espera não pode ser anterior a hoje' }` (fatia 1)
- [x] `paciente_id` inexistente → 404 `{ erro: 'Paciente não encontrado' }` (fatia 1)
- [x] `profissional_id` inexistente → 404 `{ erro: 'Profissional não encontrado' }` (fatia 1)
- [x] `paciente_id` ou `profissional_id` ausente, não inteiro ou não positivo → 400 `{ erro: 'paciente_id deve ser um número inteiro positivo' }` / `{ erro: 'profissional_id deve ser um número inteiro positivo' }` (fatia 1)
- [x] `data` ausente, `10/11/2026` ou `2026-02-30` → 400 `{ erro: 'A data deve estar no formato AAAA-MM-DD' }` (fatia 1)
- [ ] P1 e depois P2 entram na fila de A para o mesmo dia; P1 sai; P1 entra de novo → a ordem na consulta é P2, P1 (entrada nova vai para o fim) (fatias 1, 2 e 3)
- [x] sair de uma entrada existente → 200 com a entrada, e ela some da consulta (fatia 2)
- [x] sair de uma entrada que já saiu, ou de um id que nunca existiu → 404 `{ erro: 'Entrada da lista de espera não encontrada' }` (fatia 2)
- [x] `:id` = `abc` ou `0` → 400 `{ erro: 'O id da entrada deve ser um número inteiro' }` (fatia 2)
- [ ] P1, P2 e P3 entram nessa ordem na fila de A para 2026-11-10 → consulta devolve `fila` com posições 1, 2, 3 e `paciente_id` P1, P2, P3 (fatia 3)
- [ ] fila de A em 2026-11-10 não mostra entradas de A em outro dia nem de B no mesmo dia (fatia 3)
- [ ] profissional existente sem ninguém na fila → 200 com `fila: []` (fatia 3)
- [ ] profissional inexistente → 404 `{ erro: 'Profissional não encontrado' }` (fatia 3)
- [ ] `:id` do profissional = `abc` → 400 `{ erro: 'O id do profissional deve ser um número inteiro' }`; `:data` = `2026-02-30` → 400 `{ erro: 'A data deve estar no formato AAAA-MM-DD' }` (fatia 3)
- [ ] consultar a fila de um dia passado → 200 com a fila (sem recusa; consulta não muda nada) (fatia 3)

## Suposições

Decididas sem perguntar, pelo padrão do projeto; me diga se alguma deve mudar:

- Módulo novo `espera`, não `agenda`: a fila tem tabela e regras próprias, e a F4 (aviso de vaga) vai ler a fila pelo `index.ts` dele. `agenda` não muda.
- Ordem de chegada = ordem do `id` autoincrementado (não depende do relógio). `entrou_em` é só informativo, gravado em UTC e devolvido em Brasília.
- Um paciente aparece no máximo uma vez por profissional e dia; sair e entrar de novo vai para o fim da fila.
- A entrada é identificada pelo `id`; sair é `DELETE` por `id`, com remoção definitiva (sem histórico).
- A fila não confere se o dia tem expediente, se há horário livre, nem se o paciente já tem consulta com o profissional naquele dia ou está bloqueado por faltas: ela só registra o desejo de vaga.
- Não há limite de tamanho da fila.
- Não há data máxima no futuro.
- Entrar com data passada é recusado (409); hoje vale. Consultar e sair não olham a data.
- Rotas sem autenticação (como as demais). Quem pode remover a entrada de quem não é controlado.

## Fora do escopo

- Avisar o paciente quando a vaga abrir (F4).
- Converter a entrada da fila em consulta, ou removê-la quando o paciente agenda.
- Limpar entradas de dias passados.
- Fila por especialidade ou por faixa de horário; listar as filas de um paciente.
- Autenticação.
