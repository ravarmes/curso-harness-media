# Bloqueio de paciente por faltas

Status: aprovada (2026-10-25)

## Objetivo
Recusar novo agendamento de paciente que tenha 3 ou mais faltas nos últimos 90 dias.

## Fatias (na ordem de implementação)
1. agenda/registrar-falta: marca como `faltou` uma consulta `agendada` que já terminou. Nova opção de status no repositório da agenda; rota no padrão de `cancelar-consulta`.
2. agenda/agendar-consulta: antes de gravar, conta as faltas do paciente na janela e recusa se forem 3 ou mais.

## Critérios de aceite
- [x] registrar falta de consulta `agendada` que terminou há 1 min → 200, consulta com `status: 'faltou'` (fatia 1)
- [x] registrar falta de consulta que termina daqui a 1 min → 409 `{ erro: 'a consulta ainda não terminou' }` (fatia 1)
- [x] registrar falta de consulta `cancelada` → 409 `{ erro: 'a consulta está cancelada' }` (fatia 1)
- [x] registrar falta de consulta já marcada como `faltou` → 409 `{ erro: 'a falta já está registrada' }` (fatia 1)
- [x] registrar falta de consulta inexistente → 404 `{ erro: 'Consulta não encontrada' }` (fatia 1)
- [x] consulta marcada como `faltou` deixa de ocupar o horário do profissional e do paciente (fatia 1)
- [ ] paciente com 2 faltas nos últimos 90 dias agenda → 201 (fatia 2)
- [ ] paciente com 3 faltas nos últimos 90 dias agenda → 409 `{ erro: 'o paciente tem 3 faltas nos últimos 90 dias e não pode agendar' }`, nada é gravado (fatia 2)
- [ ] paciente com 3 faltas, uma delas no dia de hoje menos 90 dias (Brasília), agenda → 409; com a mais antiga no dia de hoje menos 91 dias → 201 (fatia 2)
- [ ] paciente com 2 faltas e 5 consultas canceladas agenda → 201 (fatia 2)
- [ ] faltas de outro paciente não contam: paciente A com 3 faltas, paciente B com 0 → B agenda, 201 (fatia 2)
- [ ] paciente com 3 faltas e dado malformado no corpo → 400, não 409 (a validação vem antes da regra de faltas) (fatia 2)

## Suposições
- Falta é registrada à mão, pela recepção, depois que a consulta termina. Hoje não há conceito de falta; marcar "compareceu" não é necessário porque só a falta é registrada.
- Cancelamento, mesmo em cima da hora, não conta como falta.
- O bloqueio só some com o tempo: não há desbloqueio manual. O paciente volta quando a falta mais antiga sai da janela.
- Janela de 90 dias: conta as faltas cujo dia de início (Brasília) é de (hoje − 90 dias) em diante, coerente com a regra de que "dia" usa America/Sao_Paulo.
- O bloqueio vale só para agendar. Consultas já agendadas do paciente continuam valendo.
- A conferência de faltas fica depois das validações 400/404 e antes das de horário (expediente, ocupado), pois é regra do paciente. Código 409 pela regra do AGENTS.md.
- Tudo em `agenda`, dono da regra e das consultas; nada novo em `pacientes`. Sem dependência nova.
- Bancos existentes: o status é texto, sem constraint, então `faltou` não exige migração.

## Fora do escopo
- Desbloqueio manual e exceções por paciente.
- Aviso ao paciente (WhatsApp) sobre o bloqueio.
- Contar cancelamento tardio como falta.
- Listar faltas ou mostrar o contador na consulta do paciente.
