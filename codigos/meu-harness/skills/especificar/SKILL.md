---
name: especificar
description: Transforma um pedido de funcionalidade nova em especificação escrita, com critérios de aceite verificáveis e a lista de fatias a implementar, antes de qualquer código. Use quando o usuário pedir para criar, adicionar ou construir algo novo, quando o pedido for vago ou envolver mais de uma operação, ou quando ele pedir especificação, planejamento ou critérios de aceite.
---

# Especificar

Antes de escrever código, transforme o pedido numa especificação em
`docs/specs/<nome-da-funcionalidade>.md` e espere a aprovação do usuário.

## Passos

1. Uma especificação cobre uma funcionalidade. Se o pedido traz duas ou
   mais, que o usuário veria como itens separados (por exemplo, "cadastro de
   clientes e relatório de vendas"), não especifique: use a skill
   `iniciar-projeto`, que divide o pedido numa lista para várias sessões, e
   pare.
2. Leia o pedido, o `AGENTS.md` e, se existir, o guia de arquitetura do
   projeto. Liste o que o pedido deixa em aberto.
3. Separe as lacunas em dois grupos:
   - **Pergunte** o que muda o comportamento visível ou a arquitetura:
     limites, regras de negócio, mensagens de erro, onde os dados ficam.
   - **Decida** o resto pelo padrão do projeto e registre a decisão em
     "Suposições".
4. Divida a funcionalidade em fatias: uma por operação, no módulo dono da
   regra. Se passar de seis fatias, ela não cabe numa sessão: use a skill
   `iniciar-projeto` e pare.
5. Escreva a especificação no formato abaixo, com `Status: rascunho`.
6. Mostre a especificação e pare. Quando o usuário aprovar, troque a linha
   para `Status: aprovada (<data>)`. Só implemente depois disso.

## Formato

```markdown
# <Funcionalidade>

Status: rascunho

## Objetivo
<uma frase>

## Fatias (na ordem de implementação)
1. <módulo>/<fatia>: <o que faz>

## Critérios de aceite
- [ ] <entrada concreta> → <saída esperada> (fatia N)
- [ ] <caso de recusa> → <erro esperado> (fatia N)

## Suposições
- <o que foi decidido sem perguntar, e por quê>

## Fora do escopo
- <o que não será feito agora>
```

## Critério de aceite verificável

Cada critério tem uma entrada concreta e uma saída que um teste confere.

- Ruim: "respeita o prazo de cancelamento".
- Bom: "o paciente cancelar uma consulta que começa daqui a 23 h 59 min
  devolve 409 com `{ erro: 'o paciente só cancela até 24 h antes' }`".

Toda regra de negócio tem pelo menos um critério de recusa.
