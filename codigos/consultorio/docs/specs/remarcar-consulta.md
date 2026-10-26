# Remarcar consulta

Status: aprovada (2026-10-25)

## Objetivo

O paciente ou a recepção move uma consulta agendada para outro horário livre do mesmo profissional, com as recusas do agendamento e o prazo do cancelamento; o horário antigo fica livre.

## Fatias (na ordem de implementação)

1. agenda/repositorio: `remarcar(id, inicioUtc, fimUtc)` atualiza a consulta no lugar; `profissionalOcupado` e `pacienteOcupado` passam a aceitar um id de consulta a ignorar, para que ela não conflite consigo mesma.
2. agenda/remarcar-consulta: regra e rota `POST /consultas/:id/remarcacao`, corpo `{ "quem": "paciente", "paciente_id": 3, "inicio": "...", "fim": "..." }` ou `{ "quem": "recepcao", "inicio": "...", "fim": "..." }`. Responde 200 com a consulta (mesmo `id`, mesmo paciente e profissional, novo `inicio`/`fim`) e `status: "agendada"`.

## Critérios de aceite

Considere "agora" = 2026-11-09T14:00:00-03:00, profissional 1 com expediente de segunda a sexta, 08:00–18:00, e a consulta 10 (paciente 3, profissional 1) em 2026-11-11T09:00:00-03:00 a 09:30 nos exemplos.

- [x] paciente 3 remarca a consulta 10 para 2026-11-12T10:00:00-03:00 a 10:30 → 200, mesmo `id` 10, novo início/fim, `status: "agendada"` (fatia 2)
- [x] depois de remarcar, o horário antigo (2026-11-11 09:00) aparece livre para o profissional 1 e outro paciente agenda ali → 201; a agenda do dia 12 lista a consulta e a do dia 11 não (fatias 1 e 2)
- [x] recepção remarca a consulta 10 para o novo horário livre → 200 (fatia 2)
- [x] remarcar para um intervalo que se sobrepõe ao da própria consulta (09:15 a 09:45 no mesmo dia) → 200 (fatia 1)
- [x] remarcar para horário em que o profissional 1 já tem outra consulta → 409 `{ erro: 'O profissional já tem consulta nesse horário' }`, a consulta continua no horário antigo (fatia 2)
- [x] remarcar para horário em que o paciente 3 já tem consulta com outro profissional → 409 `{ erro: 'O paciente já tem consulta nesse horário' }` (fatia 2)
- [x] remarcar para 2026-11-14T10:00:00-03:00 (sábado, sem expediente) ou para 07:30 a 08:00 → 409 `{ erro: 'A consulta está fora do expediente do profissional' }` (fatia 2)
- [x] paciente remarca a consulta que começa daqui a 23 h 59 min → 409 `{ erro: 'o paciente só remarca até 24 h antes' }`; com exatamente 24 h → 200 (fatia 2)
- [x] recepção remarca a consulta que começa daqui a 23 h 59 min → 200 (fatia 2)
- [x] recepção remarca consulta que já começou → 409 `{ erro: 'a consulta já começou' }` (fatia 2)
- [x] novo horário no passado (início antes de "agora") → 409 `{ erro: 'o novo horário já passou' }` (fatia 2)
- [x] paciente 4 remarca a consulta do paciente 3 → 409 `{ erro: 'a consulta não pertence a esse paciente' }` (fatia 2)
- [x] remarcar consulta cancelada → 409 `{ erro: 'a consulta está cancelada' }`; consulta marcada como `faltou` → 409 `{ erro: 'a consulta não está agendada' }` (fatia 2)
- [x] id de consulta que não existe → 404 `{ erro: 'Consulta não encontrada' }` (fatia 2)
- [x] `quem` ausente ou inválido, `quem: "paciente"` sem `paciente_id` inteiro positivo, id da URL não numérico, `inicio`/`fim` ausentes, sem offset ou com início ≥ fim → 400 (fatia 2)
- [x] paciente com 3 faltas remarca uma consulta agendada → 200 (o bloqueio por faltas vale só para agendar) (fatia 2)

## Suposições

- A rota segue o padrão do cancelamento (`POST /consultas/:id/remarcacao`, `quem` no corpo). Como ali, `quem` não é segurança.
- "Fora do prazo" = a regra do cancelamento aplicada ao horário atual da consulta: paciente até 24 h antes (limite incluso), recepção até a consulta começar. Além disso, o novo horário não pode começar antes de "agora". Decidido sem resposta do usuário.
- Remarcar atualiza a mesma consulta (mesmo `id`); não cria nova nem cancela a antiga, então não gera registro de cancelamento. O profissional e o paciente não mudam; o corpo traz `inicio` e `fim` novos (a duração pode mudar).
- Remarcar para um horário que sobrepõe o antigo, ou para o mesmo horário, é permitido: a consulta não conflita consigo mesma.
- Ordem das checagens: 400, 404, dono da consulta, status, prazo/começou, novo horário no passado, expediente, profissional ocupado, paciente ocupado. Código 409 para toda regra de negócio, conforme o AGENTS.md.
- Tudo em `agenda`; a regra reaproveita as checagens de expediente e ocupação do agendamento, extraídas para função compartilhada dentro do módulo, sem mudar o comportamento de `agendar-consulta`. Nada novo em outros módulos, sem dependência nova.
- Sem mudança de esquema: só `UPDATE` das colunas existentes.

## Fora do escopo

- Trocar de profissional ou de paciente.
- Autenticação e papéis reais.
- Aviso por WhatsApp da remarcação e aviso de vaga ao liberar o horário (F4).
- Histórico das remarcações e limite de quantas vezes se remarca.
- Bloqueio por faltas ao remarcar.
