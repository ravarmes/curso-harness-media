# Horários livres de um profissional

Status: aprovada (2026-10-25)

## Objetivo

O paciente consulta os horários livres de um profissional num dia, para escolher onde agendar.

## Fatias (na ordem de implementação)

1. agenda/listar-horarios-livres: regra e rota `GET /profissionais/:id/horarios-livres/:data` (`data` = AAAA-MM-DD, dia de Brasília). Responde 200 `{ profissional_id, data, duracao_min: 30, horarios: [{ inicio, fim }] }`, com `inicio`/`fim` em ISO 8601 `-03:00`, em ordem crescente. Usa o expediente do profissional (`expedienteDe`) e a checagem de ocupação do repositório (`repo.profissionalOcupado`, que já ignora canceladas).

## Critérios de aceite

Considere "agora" = 2026-11-09T14:00:00-03:00 e um profissional com expediente na terça (2026-11-10) das 08:00 às 12:00 e das 14:00 às 16:00.

- [x] dia 2026-11-10 sem consultas → 200, horários de 30 min: 08:00–08:30, 08:30–09:00, … 11:30–12:00, 14:00–14:30, … 15:30–16:00 (12 horários) (fatia 1)
- [x] consulta do profissional das 09:00 às 10:00 → 09:00–09:30 e 09:30–10:00 não aparecem; 08:30–09:00 e 10:00–10:30 aparecem (fatia 1)
- [x] consulta das 09:15 às 09:45 → 09:00–09:30, 09:30–10:00 não aparecem (qualquer sobreposição tira o horário) (fatia 1)
- [x] consulta cancelada das 09:00 às 09:30 → 09:00–09:30 aparece (fatia 1)
- [x] consulta de outro profissional no mesmo horário → não afeta a lista (fatia 1)
- [x] faixas encostadas (08:00–12:00 e 12:00–18:00) → os horários atravessam o meio-dia, ex.: 11:30–12:00 e 12:00–12:30 (fatia 1)
- [x] dia sem expediente (ex.: 2026-11-08, domingo) → 200 com `horarios: []` (fatia 1)
- [x] faixa de 14:00 às 14:45 → só 14:00–14:30 (não oferece horário que ultrapassa o fim do expediente) (fatia 1)
- [x] dia consultado é hoje (2026-11-09) → só horários com início posterior a agora (fatia 1)
- [x] dia no passado (2026-11-08) → 200 com `horarios: []` (fatia 1)
- [x] profissional que não existe → 404 `{ erro: 'Profissional não encontrado' }` (fatia 1)
- [x] id da URL não numérico → 400 `{ erro: 'O id do profissional deve ser um número inteiro' }` (fatia 1)
- [x] data `10/11/2026` ou `2026-02-30` → 400 `{ erro: 'A data deve estar no formato AAAA-MM-DD' }` (fatia 1)
- [x] todo horário devolvido, enviado a `POST /consultas` com um paciente sem conflito, é aceito (201) (fatia 1)

## Suposições

- A API não tem duração padrão de consulta e o roteador não lê query string; para não mexer em `compartilhado/http.ts` nem no cadastro de profissional, a duração é fixa em 30 min (constante no código). Duração variável fica para depois.
- Os horários começam no início de cada faixa contínua do expediente e se encadeiam de 30 em 30 min (sem sobreposição entre os listados). Faixas encostadas valem como uma só, como no agendamento.
- A lista mostra a disponibilidade do profissional; não considera as faltas ou a agenda de um paciente específico (não há paciente na consulta). Um paciente bloqueado por faltas ainda verá horários e será recusado ao agendar.
- "Hoje" usa o relógio do contexto (`agora`, injetável nos testes); horário que começa exatamente em "agora" não é oferecido.
- Dia sem expediente ou no passado é resultado vazio (200), não erro: a consulta em si é válida.
- Fica em `agenda`, dona das consultas, e usa `profissionais` só pelo `index.ts` (já exposto no `Contexto`).

## Fora do escopo

- Duração variável (por pedido ou por profissional) e passo de 15 min.
- Consultar um intervalo de vários dias.
- Reservar o horário ao listar.
- Autenticação.
