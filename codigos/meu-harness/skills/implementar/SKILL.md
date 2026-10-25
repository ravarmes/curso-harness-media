---
name: implementar
description: Implementa uma especificação aprovada uma fatia por vez, com o teste escrito antes do código e a verificação do projeto rodada a cada fatia. Use quando existir uma especificação com "Status: aprovada" em docs/specs/, ou quando o usuário pedir para implementar, continuar ou terminar uma funcionalidade já especificada.
---

# Implementar

Antes de começar, confira que a especificação diz `Status: aprovada`. Se
disser `rascunho`, pare e peça a aprovação.

Uma fatia por vez, na ordem da especificação. Copie esta lista para a
conversa e marque cada item ao concluí-lo:

```
- [ ] Fatia 1: teste falhando → código → verificação passando → commit
- [ ] Fatia 2: ...
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

Rode a verificação uma última vez e mostre a saída. Depois, para cada
critério de aceite, diga qual teste o cobre. Se algum critério ficou sem
teste, ou se algo da especificação não foi feito, diga isso claramente em
vez de dizer "pronto".
