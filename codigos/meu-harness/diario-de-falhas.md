# Diário de falhas

Uma linha por falha observada. "Controle que faltou" diz que tipo
de controle teria evitado a falha (guia, sensor ou barreira;
computacional ou inferencial). "Resolvido em" fica vazio até um
capítulo resolvê-la.

| # | Rodada | O que o agente fez | O que deveria ter feito | Controle que faltou | Resolvido em |
|---|--------|--------------------|-------------------------|---------------------|--------------|
| F01 | cap01 | Escolheu Python + FastAPI sem perguntar, mesmo vendo o Node instalado | Usar a stack do autor (TypeScript) ou perguntar | Guia inferencial | |
| F02 | cap01 | Pôs rotas, validação, regra de conflito e agendador num só `main.py`, a regra em SQL dentro da rota | Regra de negócio separada da rota, uma pasta por operação, com teste próprio | Guia inferencial + sensor computacional | |
| F03 | cap01 | Aceitou o mesmo paciente em duas consultas no mesmo horário; o teste dele dá isso como certo | Perguntar, ou escrever a regra antes do código | Guia inferencial | |
| F04 | cap01 | Aceitou consulta num domingo às 3h e uma de 7 horas atravessando a madrugada | Perguntar o horário de atendimento, ou registrar a suposição | Guia inferencial | |
| F05 | cap01 | O lembrete diz "é amanhã" para consulta do mesmo dia | Montar o texto a partir da data e testar o texto | Sensor computacional + sensor inferencial | |
| F06 | cap01 | Disse que a mensagem simulada "aparece no log"; ela não aparece (log.info descartado) | Rodar o caminho antes de afirmar | Sensor inferencial (comportamento) | |
| F07 | cap01 | Testes presos ao relógio real e sem a fronteira das 24 h | Relógio injetável e teste na fronteira | Guia inferencial + sensor inferencial | |
| F08 | cap01 | Terminou sem nenhum commit | Commit por funcionalidade, com a verificação passando | Guia inferencial + sensor computacional | |
| F09 | cap01 | Decidiu sozinho o código de cada erro, e a decisão mudou na segunda rodada (409 → 422) | Um contrato de erros único, escrito no projeto | Guia inferencial | |

## Nota da rodada cap01

- Janela de contexto: 24.283 tokens já na primeira chamada, antes de qualquer trabalho;
  38.579 na última. (Medido pelo uso de tokens que a sessão registrou; na sua rodada,
  use o `/context`.)
- Maior parte do gasto: o que entra sempre (instruções do fabricante, as 31 ferramentas,
  a lista de skills), cerca de dois terços do total.
- Pedidos de permissão: 12 (4 comandos no terminal, 7 arquivos criados, 1 edição).
