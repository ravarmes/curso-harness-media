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
