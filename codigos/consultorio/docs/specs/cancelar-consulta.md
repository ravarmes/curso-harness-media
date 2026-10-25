# Cancelar consulta

Status: aprovada (2026-10-25)

## Objetivo
O paciente cancela a própria consulta até 24 h antes do início; depois disso, só a recepção cancela.

## Fatias (na ordem de implementação)
1. agenda/repositorio: coluna `status` (`agendada`/`cancelada`) em `consultas`, busca de consulta por id, marcação como cancelada. A checagem de horário ocupado e a agenda do dia passam a ignorar consultas canceladas.
2. agenda/cancelar-consulta: regra e rota `POST /consultas/:id/cancelamento`, corpo `{ "quem": "paciente", "paciente_id": 3 }` ou `{ "quem": "recepcao" }`. Responde 200 com a consulta e `status: "cancelada"`.

## Critérios de aceite
Considere "agora" = 2026-11-09T14:00:00-03:00 nos exemplos.

- [x] paciente dono cancela consulta que começa em 2026-11-10T14:00:00-03:00 (exatamente 24 h) → 200, consulta com `status: "cancelada"` (fatia 2)
- [x] paciente dono cancela consulta que começa em 2026-11-10T13:59:00-03:00 (23 h 59 min) → 409 `{ erro: 'o paciente só cancela até 24 h antes' }` (fatia 2)
- [x] recepção cancela a mesma consulta de 23 h 59 min → 200 (fatia 2)
- [x] recepção cancela consulta que já começou (início 2026-11-09T13:00:00-03:00) → 409 `{ erro: 'a consulta já começou' }` (fatia 2)
- [x] paciente 4 tenta cancelar consulta do paciente 3 → 409 `{ erro: 'a consulta não pertence a esse paciente' }` (fatia 2)
- [x] cancelar consulta já cancelada → 409 `{ erro: 'a consulta já está cancelada' }` (fatia 2)
- [x] id de consulta que não existe → 404 `{ erro: 'Consulta não encontrada' }` (fatia 2)
- [x] `quem` ausente ou diferente de `paciente`/`recepcao` → 400; `quem: "paciente"` sem `paciente_id` inteiro positivo → 400; id da URL não numérico → 400 (fatia 2)
- [x] depois de cancelar, agendar outra consulta no mesmo horário do mesmo profissional ou paciente → 201 (fatia 1)
- [x] depois de cancelar, a agenda do dia do profissional não lista a consulta (fatia 1)

## Suposições
- Sem login na API, "quem cancela" vem no corpo (`quem`). Não é segurança: qualquer cliente pode se declarar recepção. Autenticação real fica para outra funcionalidade.
- Cancelar marca `status = 'cancelada'` em vez de apagar, para manter o histórico. Bancos existentes ganham a coluna com padrão `agendada`.
- "Até 24 h antes" inclui o limite: início − agora ≥ 24 h é permitido ao paciente. O cálculo usa instantes UTC, então não depende do fuso.
- O relógio vem do contexto (função `agora`, injetável nos testes), como pede a regra de testes sem depender da hora real.
- Ninguém cancela consulta que já começou, nem a recepção.
- Paciente cancelar consulta de outro é regra de negócio recusada (409), não 403, pois o projeto só usa 400/404/409.
- A fatia fica em `agenda`, dona da consulta; usa `pacientes` só se precisar (não precisa: basta comparar `paciente_id`).

## Fora do escopo
- Autenticação, papéis reais e cabeçalhos de identidade.
- Remarcar consulta, notificações, motivo do cancelamento, multa.
- Listar consultas canceladas.
