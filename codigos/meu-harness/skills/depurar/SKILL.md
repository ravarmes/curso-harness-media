---
name: depurar
description: Investiga e corrige um defeito reproduzindo-o primeiro num teste que falha, encontrando a causa antes de mexer no código e confirmando a correção com a verificação do projeto. Use quando o usuário relatar um bug, um erro, um comportamento inesperado, um teste quebrado ou uma mensagem de exceção, ou disser que algo "parou de funcionar".
---

# Depurar

Nunca corrija antes de reproduzir. A ordem é: reproduzir, explicar,
corrigir, confirmar.

## Passos

1. **Reproduza.** Escreva um teste que falha exatamente pelo defeito
   relatado, ao lado da fatia onde ele acontece. Rode e confirme a falha.
   Se não conseguir reproduzir, pare e diga o que tentou.
2. **Explique.** Antes de editar, diga em duas frases qual é a causa e por
   que ela produz o sintoma, e siga. Pare para perguntar só se a correção
   mudar um comportamento que o usuário combinou antes. Se houver mais de
   uma hipótese, teste a mais barata primeiro (um `console.log`, um caso
   menor) e descarte as outras com evidência.
3. **Corrija** a causa, não o sintoma. Mudança mínima.
4. **Confirme.** O teste novo passa e a verificação do projeto inteira
   passa. Mostre a saída.
5. **Relate:** sintoma, causa, correção e o teste que agora protege contra
   a volta do defeito.

Se a correção exigir mudar um teste existente, explique por que o teste
estava errado antes de mudá-lo.
