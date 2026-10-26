# Progresso

## 2026-10-25 — iniciar-projeto
- Feito: projeto criado do modelo; lista com 8 funcionalidades.
- Verificação: passando.
- Próximo passo: F1, depois de o usuário aprovar a lista.

## 2026-10-25 — F1 Cardápio
- Feito: módulo `cardapio` com cadastrar-item, listar-itens e consultar-item; testes de regra e testes HTTP (`cardapio.http.test.ts`).
- Revisão: 1ª bloqueou por falta de testes HTTP, corrigido; 2ª aprovada. Verificador: 11 de 11 critérios.
- Verificação: `npm run verify` passando.
- Próximo passo: F2, Estoque.

## 2026-10-25 — F2 Estoque
- Feito: módulo `estoque` com cadastrar-ingrediente, repor-ingrediente, listar-estoque e consultar-ingrediente; testes de regra e testes HTTP (`estoque.http.test.ts`).
- Revisão: aprovada de primeira, sem bloqueios. Melhorias anotadas, não feitas: teto para `quantidade` (inteiros acima de `Number.MAX_SAFE_INTEGER` passam) e teste de nome duplicado com acento (`Pão`/`PÃO`).
- Verificador: 14 de 14 critérios.
- Verificação: `npm run verify` passando.
- Próximo passo: F3, Receita do item.

## 2026-10-25 — F3 Receita do item
- Feito: módulo novo `receitas` com definir-receita (`PUT /cardapio/:id/receita`, substitui a receita inteira) e consultar-receita (`GET /cardapio/:id/receita`); `cardapio` e `estoque` passaram a expor `existeItem` e `nomeDoIngrediente` pelo `index.ts`, entregues a `receitas` pelo `app.ts`. Testes de regra e testes HTTP (`receitas.http.test.ts`).
- Revisão: aprovada, sem bloqueios. Melhorias anotadas, não feitas: o texto `ingrediente N` em `consultar-receita.ts` para ingrediente que sumiu do estoque (hoje impossível, sem teste); testes HTTP sem os casos de `quantidade`/`ingredienteId` ausente, em texto ou decimal (cobertos nos testes de regra).
- Verificador: 11 de 11 critérios.
- Verificação: `npm run verify` passando.
- Próximo passo: F4, Bairros.

## 2026-10-25 — F4 Bairros
- Feito: módulo novo `bairros` com cadastrar-bairro (`POST /bairros`), listar-bairros (`GET /bairros`) e consultar-bairro (`GET /bairros/:id`); taxa em centavos, aceita 0. O `index.ts` expõe `taxaDoBairro` para a F6, registrado em `app.ts`. Testes de regra por fatia e testes HTTP (`bairros.http.test.ts`).
- Revisão: aprovada, sem bloqueios. Melhoria anotada, não feita: nenhum teste cobre unicidade de nomes com acento (`Várzea`/`VÁRZEA`).
- Verificador: 10 de 10 critérios.
- Verificação: `npm run verify` passando.
- Próximo passo: F5, Cupons.

## 2026-10-25 — F5 Cupons
- Feito: módulo novo `cupons` com cadastrar-cupom (`POST /cupons`) e consultar-cupom (`GET /cupons/:codigo`); desconto percentual inteiro de 1 a 100, sem validade; código aparado, em maiúsculas, até 30 caracteres (letras, números e hífen), único. O `index.ts` expõe `cupomPorCodigo` para a F7, registrado em `app.ts`. Testes de regra por fatia e testes HTTP (`cupons.http.test.ts`).
- Revisão: aprovada, sem bloqueios. Melhorias anotadas, não feitas: o teste HTTP do 409 não confere pela API que o percentual original não mudou (coberto só no teste unitário); a consulta também apara espaços, além do pedido na especificação.
- Verificador: 10 de 10 critérios.
- Verificação: `npm run verify` passando.
- Próximo passo: F6, Pedido.
