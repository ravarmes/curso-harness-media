# Progresso

## 2026-10-25 — iniciar-projeto
- Feito: lista para o projeto existente (fase 2); lista com 4 funcionalidades (F1 remarcar, F2 relatório de ocupação, F3 lista de espera, F4 aviso de vaga).
- Verificação: passando (npm run verify).
- Próximo passo: F1, depois de o usuário aprovar a lista.

## 2026-10-25 — F1 remarcar consulta
- Feito: especificação `docs/specs/remarcar-consulta.md` (aprovada); `POST /consultas/:id/remarcacao` em `agenda/remarcar-consulta`; repositório com `remarcar` e `ignorar` nas checagens de ocupação; checagem de expediente/ocupação extraída para `agenda/disponibilidade.ts` e reaproveitada por `agendar-consulta`.
- Verificação: passando (npm run verify, 123 testes). Revisor: aprovado. Verificador: aprovado; os limites de 24 h não são verificáveis pela API (relógio real) e ficam cobertos pelos testes unitários.
- Melhorias sugeridas pelo revisor, não feitas: teste HTTP da rota, `paciente_id` inválido (0/negativo/fracionário) no teste de 400, limite exato do "novo horário já passou".
- Próximo passo: F2, relatório de ocupação por profissional.

## 2026-10-25 — F2 relatório de ocupação por profissional
- Feito: especificação `docs/specs/relatorio-de-ocupacao.md` (aprovada); `profissionais.listar()` no `index.ts`; `GET /relatorios/ocupacao/:de/:ate` em `agenda/relatorio-de-ocupacao`; repositório com `ocupadasDoProfissionalNoPeriodo` (agendadas e faltas, sem canceladas).
- Decisões tomadas sem resposta do usuário (a pergunta foi dispensada): falta conta como hora ocupada; período máximo de 92 dias (409); percentual sem teto.
- Verificação: passando (npm run verify, exit 0; rodado `npm install` antes, pois faltava `node_modules`). Revisor: aprovado. Verificador: aprovado; `listar()` não tem rota e só foi observado indiretamente (ordem por id no relatório), coberto pelo teste unitário.
- Melhorias sugeridas pelo revisor, não feitas: não arredondar `horas_expediente`/`horas_ocupadas` (a spec só pede arredondar o percentual); teste HTTP com `ate` malformado.
- Próximo passo: F3, lista de espera.

## 2026-10-25 — F3 lista de espera
- Feito: especificação `docs/specs/lista-de-espera.md` (aprovada); módulo novo `espera` com `POST /lista-de-espera`, `DELETE /lista-de-espera/:id` e `GET /profissionais/:id/lista-de-espera/:data`; tabela `lista_de_espera` (única por paciente, profissional e dia); registrado em `src/app.ts`; teste ponta a ponta em `tests/espera.test.ts`.
- Mudança fora do módulo: `tempo.ts` saiu de `agenda/` para `compartilhado/` (o teste de arquitetura proíbe um módulo importar de outro fora do `index.ts`); só os imports da agenda mudaram.
- Suposições da spec aprovada: ordem de chegada = ordem do id; sair é remoção definitiva; data anterior a hoje é recusada (409) só ao entrar; a fila não confere expediente, vaga nem faltas.
- Verificação: `npm run verify` passando (exit 0). Revisor: aprovado. Verificador: aprovado em todos os critérios; fila de dia passado só foi observada vazia (não dá para criar entrada em dia passado).
- Melhorias sugeridas pelo revisor, não feitas: `GET /profissionais/0/lista-de-espera/...` dá 404 e não 400 (`lerId('0')` devolve 0; `sair-da-lista` já trata); teste do limite de data perto da meia-noite de Brasília; o formatador reindentou `listar-horarios-livres.test.ts` sem relação com a mudança.
- Próximo passo: F4, aviso de vaga (lê a fila pelo `index.ts` de `espera`, que ainda não expõe nada para outros módulos).
