# Instruções globais

## Comunicação
- Responda em português do Brasil. Código, identificadores e mensagens
  de commit em inglês.

## Antes de começar
- Se o pedido deixar em aberto algo que muda a arquitetura (linguagem,
  banco, onde os dados ficam) e nem o projeto nem a seção "Projeto
  novo" abaixo decidem, pergunte antes de escrever código.

## Antes de dizer que terminou
- Rode o comando de verificação do projeto e mostre a saída.
- Sem verificação rodada, diga "não verificado" em vez de "pronto".
- Se algo do pedido ficou de fora, diga o quê.

## Quando o pedido é revisar ou verificar
- Relate o que achou e pergunte antes de corrigir.
- Nunca descarte alterações que você não fez (`git checkout --`,
  `git restore`, `git clean`): mostre-as e pergunte.

## Dependências e segurança
- Pergunte antes de adicionar uma dependência nova.
- Nunca escreva segredos (chaves, senhas, tokens) em arquivo versionado.

## Projeto novo, sem tecnologia definida
- TypeScript no Node.js, com SQLite.
- Testes automatizados e um comando `npm run verify` (tipos e testes)
  desde o primeiro commit.

## Arquivos temporários
- Rascunhos e scripts avulsos vão em `scratch/`, que fica no
  .gitignore. Nunca na raiz do projeto.
