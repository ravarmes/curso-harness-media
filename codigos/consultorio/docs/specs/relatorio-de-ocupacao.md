# Relatório de ocupação por profissional

Status: aprovada (2026-10-25)

## Objetivo

A recepção consulta, para um período de dias de Brasília, quanto do expediente de cada profissional foi ocupado por consultas.

## Fatias (na ordem de implementação)

1. profissionais/index: expor `listar()` (id e nome de todos os profissionais, em ordem de id) para a agenda usar pelo `index.ts`. Sem rota nova.
2. agenda/relatorio-de-ocupacao: regra e rota `GET /relatorios/ocupacao/:de/:ate` (`de` e `ate` = AAAA-MM-DD, dias de Brasília, ambos inclusos). Responde 200 `{ de, ate, profissionais: [{ profissional_id, nome, horas_expediente, horas_ocupadas, percentual_ocupacao }] }`, um item por profissional, em ordem de id. Usa o expediente (`expedienteDe`) e o repositório (`doProfissionalNoPeriodo`, que já ignora canceladas; ajustar para incluir `faltou`, ver Suposições).

## Critérios de aceite

Profissional A com expediente na segunda (2026-11-09) e na terça (2026-11-10) das 08:00 às 12:00 (4 h por dia).

- [x] período 2026-11-09 a 2026-11-10 sem consultas → A: `horas_expediente: 8`, `horas_ocupadas: 0`, `percentual_ocupacao: 0` (fatia 2)
- [x] consultas de A de 30 min às 09:00 e 10:00 na segunda → `horas_ocupadas: 1`, `percentual_ocupacao: 12.5` (fatia 2)
- [x] período de um dia só (`de` = `ate` = 2026-11-10) → `horas_expediente: 4` (fatia 2)
- [x] período com dias sem expediente (2026-11-08 a 2026-11-10, domingo incluso) → domingo soma 0 em `horas_expediente` (fatia 2)
- [x] faixas encostadas (08:00–12:00 e 12:00–18:00) → contam 10 h no dia, sem dupla contagem (fatia 2)
- [x] consulta cancelada → não entra em `horas_ocupadas` (fatia 2)
- [x] consulta em que o paciente faltou → entra em `horas_ocupadas` (fatia 2)
- [x] consulta de 23:30 do dia `ate` (Brasília) → entra; consulta de 00:00 do dia seguinte → não entra (fatia 2)
- [x] consulta de outro profissional → não afeta A (fatia 2)
- [x] profissional sem expediente → `horas_expediente: 0`, `horas_ocupadas: 0`, `percentual_ocupacao: 0` (sem divisão por zero) (fatia 2)
- [x] nenhum profissional cadastrado → 200 com `profissionais: []` (fatia 2)
- [x] `de` ou `ate` como `10/11/2026` ou `2026-02-30` → 400 `{ erro: 'As datas devem estar no formato AAAA-MM-DD' }` (fatia 2)
- [x] `ate` anterior a `de` → 409 `{ erro: 'A data final não pode ser anterior à inicial' }` (fatia 2)
- [x] período de 93 dias → 409 `{ erro: 'O período deve ter no máximo 92 dias' }`; de 92 dias → 200 (fatia 2)
- [x] `listar()` devolve todos os profissionais em ordem de id (fatia 1)

## Suposições

- Não há query string no roteador (`compartilhado/http.ts` só entrega parâmetros de caminho); o período vai no caminho, como em `horarios-livres/:data`, sem mexer na infraestrutura.
- Decidido sem resposta do usuário: consulta com falta conta como ocupada (o horário ficou reservado); só canceladas ficam de fora. Exige incluir `faltou` na busca do repositório (nova consulta, sem alterar `doProfissionalNoPeriodo`, que as outras fatias usam).
- Decidido sem resposta do usuário: período máximo de 92 dias, para limitar o custo da consulta; acima disso, 409 (regra de negócio, bem formado).
- Consulta pertence ao período pelo horário de início (dia de Brasília), como em `doProfissionalNoPeriodo`; a duração inteira dela é contada.
- Horas são números decimais (30 min = 0.5). `percentual_ocupacao` = ocupadas / expediente × 100, arredondado a 1 casa; sem teto (pode passar de 100 se o expediente foi reduzido depois do agendamento).
- Expediente por dia da semana, somando os dias do período; faixas encostadas ou sobrepostas viram uma só, como no agendamento. Não desconta dias passados nem feriados.
- Fica em `agenda` (dona das consultas) e usa `profissionais` só pelo `index.ts`.

## Fora do escopo

- Filtrar por um profissional ou por especialidade.
- Detalhe por dia; relatório de faltas ou cancelamentos.
- Feriados e exceções de expediente.
- Autenticação.
