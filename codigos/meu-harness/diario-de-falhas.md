# Diário de falhas

Uma linha por falha observada. "Controle que faltou" diz que tipo
de controle teria evitado a falha (guia, sensor ou barreira;
computacional ou inferencial). "Resolvido em" fica vazio até um
capítulo resolvê-la.

| # | Rodada | O que o agente fez | O que deveria ter feito | Controle que faltou | Resolvido em |
|---|--------|--------------------|-------------------------|---------------------|--------------|
| F01 | cap01 | Escolheu Python + FastAPI sem perguntar, mesmo vendo o Node instalado | Usar a stack do autor (TypeScript) ou perguntar | Guia inferencial | cap02 |
| F02 | cap01 | Pôs rotas, validação, regra de conflito e agendador num só `main.py`, a regra em SQL dentro da rota | Regra de negócio separada da rota, uma pasta por operação, com teste próprio | Guia inferencial + sensor computacional | cap03 |
| F03 | cap01 | Aceitou o mesmo paciente em duas consultas no mesmo horário; o teste dele dá isso como certo | Perguntar, ou escrever a regra antes do código | Guia inferencial | cap04 |
| F04 | cap01 | Aceitou consulta num domingo às 3h e uma de 7 horas atravessando a madrugada | Perguntar o horário de atendimento, ou registrar a suposição | Guia inferencial | cap04 |
| F05 | cap01 | O lembrete diz "é amanhã" para consulta do mesmo dia | Montar o texto a partir da data e testar o texto | Sensor computacional + sensor inferencial | |
| F06 | cap01 | Disse que a mensagem simulada "aparece no log"; ela não aparece (log.info descartado) | Rodar o caminho antes de afirmar | Sensor inferencial (comportamento) | |
| F07 | cap01 | Testes presos ao relógio real e sem a fronteira das 24 h | Relógio injetável e teste na fronteira | Guia inferencial + sensor inferencial | cap04 |
| F08 | cap01 | Terminou sem nenhum commit | Commit por funcionalidade, com a verificação passando | Guia inferencial + sensor computacional | |
| F09 | cap01 | Decidiu sozinho o código de cada erro, e a decisão mudou na segunda rodada (409 → 422) | Um contrato de erros único, escrito no projeto | Guia inferencial | cap02 (no projeto que tem o contrato) |
| F10 | cap02 | O `AGENTS.md` dava o comando dos testes com o `.venv`, que não existia; o agente gastou quatro chamadas procurando um Python e achou primeiro um que não roda o código | A instrução dizer como preparar o projeto na primeira vez | Guia inferencial (instruções do projeto) | cap02 |
| F11 | cap02 | Para desligar o servidor de teste dele, encerrou todos os processos Node da máquina (`taskkill //F //IM node.exe`) | Parar o próprio processo pelo número (PID) | Barreira computacional | |
| F12 | cap03 | Disse que a consulta que atravessa a meia-noite passa se o dia seguinte tiver expediente; o código recusa toda consulta que passa da meia-noite, e o teste dele só confere o lado da recusa | Testar o que afirma, os dois lados da regra | Sensor inferencial (revisor e verificador) | |
| F13 | cap04 | Viu o teste falhar pelo motivo errado (o método ou o arquivo ainda não existiam) e seguiu para o código, contra o passo 2 da implementar; contou isso no relatório | Ver o teste falhar na asserção do critério antes de escrever o código | Guia inferencial existia; sensor inferencial (revisor do processo) | |

## Nota da rodada cap01

- Janela de contexto: 24.283 tokens já na primeira chamada, antes de qualquer trabalho;
  38.579 na última. (Medido pelo uso de tokens que a sessão registrou; na sua rodada,
  use o `/context`.)
- Maior parte do gasto: o que entra sempre (instruções do fabricante, as 31 ferramentas,
  a lista de skills), cerca de dois terços do total.
- Pedidos de permissão: 12 (4 comandos no terminal, 7 arquivos criados, 1 edição).

## Nota da rodada cap02

- Instruções na janela: 929 tokens (`/context`): `CLAUDE.md` 26, `AGENTS.global.md`
  446, `consultorio/AGENTS.md` 457. Menos de 5% do que já entra antes do pedido.
- Expediente: seguiu o contrato de erros (404, 409, 422) e rodou os testes, mas não
  mostrou a saída, só o número ("os 10 testes passam").
- O contrato se contradizia: o 422 do FastAPI vem com `detail` em lista, em inglês, e a
  instrução dizia "sempre uma mensagem em português". Corrigido no `AGENTS.md`.
- F03 e F08 continuam: nenhuma instrução fala delas.
- O mesmo pedido do cap01, num projeto novo e só com as instruções globais: TypeScript,
  `npm run verify`, perguntou antes de instalar. Mas o contrato de erros voltou a ser
  dele (400 e 422, `{"error": ...}` em inglês). O contrato é do projeto, e aquele projeto
  ainda não tinha um.

## Nota da rodada cap03

- O consultório recomeçou do modelo de projeto, em TypeScript, com o v0 ao lado só para
  consulta. Duas rodadas: cadastros (33 testes) e agendamento com agenda do dia (51).
- O agente leu `docs/arquitetura.md` antes de escrever, nas duas, e o teste de arquitetura
  não teve o que reprovar. Os outros sensores trabalharam: o `tsc` e os testes reprovaram
  o primeiro `verify` dos cadastros, e ele corrigiu pelo que leu.
- Para ver o sensor de arquitetura agir, um atalho foi plantado (a agenda consultando o
  repositório de pacientes). O `verify` reprovou com a mensagem da regra 1, e numa sessão
  curta o agente corrigiu o código pelo `index.ts`, sem tocar no teste.
- F03 e F04 não se repetiram, mas porque o pedido dizia as duas regras. Garantir que a
  regra seja perguntada antes do código é do cap. 4; por isso as duas seguem abertas.
- "Na primeira vez: `npm install`" não foi seguida de saída: o agente rodou o `verify`,
  viu o `tsc` faltar e só então instalou. Custou uma volta.
- F08 continua: nenhum commit nas três sessões.

## Nota da rodada cap04

- Gatilho (sete pedidos, uma sessão cada): a especificar disparou nos quatro pedidos de
  funcionalidade, a depurar no do teste falhando, e nada disparou no de renomear e no de
  explicar um arquivo. Nenhum ajuste de descrição foi preciso.
- Cancelamento: a especificar perguntou duas coisas (quem cancela, numa API sem login; o
  que é "até 24 h antes"), escreveu `docs/specs/cancelar-consulta.md` com dez critérios e
  parou. Depois do "aprovado", a implementar fez duas fatias, um commit cada, e ligou cada
  critério a um teste no relatório. A fronteira das 24 h exatas tem teste, com o relógio
  injetável (F07).
- Nos dois casos, o teste vermelho antes do código veio pelo motivo errado (F13). O agente
  seguiu e contou no relatório.
- Depuração: o defeito foi plantado (o dia da agenda começando à meia-noite UTC), e o teste
  que o pegaria foi retirado. A depurar reproduziu num teste que falhou pela asserção,
  explicou a causa, corrigiu uma linha e confirmou. Não fez commit (F08 continua em parte).
