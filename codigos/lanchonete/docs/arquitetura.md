# Arquitetura

Monólito modular organizado em fatias verticais. As regras de fronteira
abaixo são conferidas por `tests/arquitetura.test.ts`, que roda dentro do
`npm run verify`.

## Onde cada coisa fica

- `src/modulos/<módulo>/`: um módulo por área do negócio (ex.: `pacientes`,
  `agenda`). Nome em português.
- `src/modulos/<módulo>/<fatia>/`: uma pasta por operação, com o nome dela
  (ex.: `agendar-consulta/`). Três arquivos:
  - `<fatia>.ts`: a regra de negócio. Recebe dados simples e devolve
    `{ ok: true, ... }` ou `{ ok: false, erro }`. Não conhece HTTP.
  - `<fatia>.test.ts`: os testes da regra, inclusive os casos de recusa.
  - `rota.ts`: traduz HTTP para a regra e o resultado para HTTP. Nada mais.
- `src/modulos/<módulo>/repositorio.ts`: o acesso ao banco do módulo.
- `src/modulos/<módulo>/index.ts`: a API pública do módulo. É onde as fatias
  recebem o repositório e onde o módulo expõe o que os outros podem usar.
- `src/compartilhado/`: infraestrutura comum (HTTP, banco). Não conhece
  nenhum módulo.
- `src/app.ts`: registra os módulos. Módulo novo entra aqui.

## Regras de fronteira

1. Um módulo usa outro só pelo `index.ts` dele.
2. `compartilhado/` não importa nada de `modulos/`.
3. A regra de negócio não importa HTTP; a rota não importa o repositório.
4. Toda fatia tem o seu arquivo de teste.

## Quando uma operação envolve dois módulos

Ela mora no módulo dono da regra e usa o outro pelo `index.ts`. Exemplo: o
agendamento é regra de `agenda`, que pergunta a `pacientes`, pelo
`index.ts`, se o paciente existe.
