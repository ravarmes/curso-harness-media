# Lembrete por WhatsApp na véspera da consulta

Status: aprovada (2026-10-25)

## Objetivo

Enviar ao paciente, pelo provedor de WhatsApp, uma mensagem na véspera de cada consulta agendada.

## Fatias (na ordem de implementação)

1. agenda/consultas-da-vespera (API pública em `agenda/index.ts`): devolve as consultas `agendada` de todos os profissionais que começam no dia seguinte ao de hoje, em Brasília. O `lembretes` precisa disso e não pode ler o repositório da agenda.
2. lembretes/enviar-lembretes-da-vespera: regra que, dado "hoje" (data de Brasília), pega as consultas de amanhã, monta o texto, envia pelo provedor e registra o resultado de cada uma.
3. lembretes/rota: `POST /lembretes/enviar-da-vespera`, chamado por um cron externo. Responde `200 { enviados, falhas, jaEnviados }`.
4. lembretes/provedor-whatsapp: cliente HTTP do provedor (`WHATSAPP_URL` e `WHATSAPP_TOKEN` do ambiente), injetável para os testes usarem um falso em memória.

Módulo novo `lembretes` (registrado em `src/app.ts`), com repositório próprio e tabela `lembretes (consulta_id UNIQUE, status 'enviado'|'falhou', tentado_em)`. Usa `agenda`, `pacientes` e `profissionais` só pelos `index.ts`.

## Critérios de aceite

- [x] Consulta agendada amanhã (Brasília) 2026-11-10T14:00:00-03:00 de paciente com telefone 5511999990000 → o provedor recebe `{ para: '5511999990000', texto: 'Olá, <nome>! Lembrete: você tem consulta amanhã, 10/11 às 14:00, com <profissional>.' }` e o resultado conta 1 enviado (fatia 2).
- [x] Consulta às 23:30 de Brasília de amanhã (já é o dia seguinte em UTC) → entra no lembrete; consulta às 00:30 de Brasília de depois de amanhã (ainda é amanhã em UTC) → não entra (fatia 2).
- [x] Consultas de hoje, de depois de amanhã e consultas canceladas → nenhuma mensagem (fatia 2).
- [x] Chamar o endpoint duas vezes no mesmo dia → a segunda não reenvia: `jaEnviados` = 1, provedor recebe 1 mensagem (fatia 2).
- [x] Provedor falha (401, 5xx ou fora do ar) para uma consulta → ela fica `falhou`, as demais continuam sendo enviadas, resposta 200 com `falhas` = 1; nova chamada reenvia só a que falhou (fatia 2).
- [x] `WHATSAPP_URL` ou `WHATSAPP_TOKEN` ausente → 409 `{ erro: 'provedor de WhatsApp não configurado' }` e nada é enviado (fatias 2 e 3).
- [x] Sem consultas amanhã → 200 `{ enviados: 0, falhas: 0, jaEnviados: 0 }` (fatia 3).
- [x] Consulta que o paciente cancelou depois de o lembrete ter sido enviado não gera nova mensagem (fatia 2).
- [x] Rota só aceita POST; outro método → 404 `{ erro: ... }` pelo roteador existente (fatia 3).

## Suposições

- Disparo por endpoint chamado por cron externo, não por timer no processo: a API não tem agendador, e assim o envio é testável e não se perde se o processo cair.
- "Véspera" = a consulta começa amanhã pela data de Brasília (America/Sao_Paulo), conforme o AGENTS.md.
- Falha do provedor não derruba o lote; é registrada e reenviada na próxima chamada. O registro por `consulta_id` único evita duplicar mensagem.
- Telefone do paciente é enviado como está cadastrado (sem normalização).
- Texto como no primeiro critério, hora em Brasília.
- Configuração só por variáveis de ambiente (`.env.exemplo` já tem as duas); nenhum segredo em arquivo versionado. Nenhuma dependência nova (usa `fetch` do Node).
- Erro de configuração usa 409 (regra recusa o pedido), seguindo o padrão do projeto.

## Fora do escopo

- Agendador/cron em si (fica no servidor).
- Reenvio por mudança de horário da consulta, lembrete de outras antecedências, confirmação de presença pelo paciente.
- Provedor real de WhatsApp; só o falso de `ferramentas/provedor-falso.ts`.
- Opt-out do paciente.
