---
name: implementar
description: Implementa uma especificação aprovada uma fatia por vez, com o teste escrito antes do código e a verificação do projeto rodada a cada fatia. Use quando existir uma especificação com "Status: aprovada" em docs/specs/, ou quando o usuário pedir para implementar, continuar ou terminar uma funcionalidade já especificada.
---

# Implementar

Antes de começar, confira que a especificação diz `Status: aprovada`. Se
disser `rascunho`, pare e peça a aprovação. Anote o commit atual
(`git rev-parse --short HEAD`): é a base que o revisor vai comparar.

Uma fatia por vez, na ordem da especificação. Copie esta lista para a
conversa e marque cada item ao concluí-lo:

```
- [ ] Fatia 1: teste falhando → código → verificação passando → commit
- [ ] Fatia 2: ...
- [ ] Revisão
- [ ] Verificação de comportamento
- [ ] Relatório final
```

## Para cada fatia

1. Abra uma fatia existente do mesmo módulo e use-a como modelo. Se for a
   primeira do projeto, leia antes o guia de arquitetura.
2. Escreva os testes dos critérios de aceite desta fatia, inclusive os de
   recusa. Rode e confirme que **falham**, e pelo motivo certo: a asserção
   do critério, não um erro de importação ou de digitação. Teste que já
   passa antes do código não prova nada sobre o código novo.
3. Escreva o código até os testes passarem. Ligue a fatia onde o guia de
   arquitetura mandar.
4. Rode o comando de verificação do projeto (está no `AGENTS.md`). Se
   falhar, leia a mensagem, corrija o **código** e rode de novo. Não altere
   testes de arquitetura nem afrouxe testes para passar.
5. Marque na especificação os critérios atendidos. Se o projeto usa Git,
   faça um commit só desta fatia.

## Ao terminar

1. Rode a verificação uma última vez.
2. Despache o subagente `revisor` com o caminho da especificação e o commit
   de base. Corrija o que ele marcar como **bloqueia**, rode a verificação e
   despache-o de novo. Se depois da segunda revisão ainda houver bloqueio,
   pare e mostre os achados ao usuário.
3. Despache o subagente `verificador` com o nome da especificação (o arquivo,
   sem pasta nem extensão, como `bloqueio-por-faltas`). Se ele reprovar um critério,
   trate como defeito: escreva um teste que reproduza o que ele observou,
   corrija, verifique e despache-o de novo. Se depois da segunda verificação
   ainda houver critério reprovado, pare e mostre o relatório ao usuário.
4. Relate: a saída da verificação, os vereditos do revisor e do verificador
   e, para cada critério de aceite, o teste que o cobre. Achados de melhoria
   vão no relatório, sem correção. Se algum critério ficou sem teste, ou se
   algo da especificação não foi feito, diga isso claramente em vez de dizer
   "pronto".
