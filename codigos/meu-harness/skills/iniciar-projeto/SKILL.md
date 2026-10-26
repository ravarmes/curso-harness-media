---
name: iniciar-projeto
description: Prepara um trabalho que não cabe numa sessão. Cria o projeto a partir do modelo do harness, se a pasta estiver vazia, e divide o pedido numa lista de funcionalidades para várias sessões. Use quando o usuário pedir para começar, criar ou montar do zero um projeto, sistema, aplicação ou API, ou quando pedir, num projeto existente, um conjunto de funcionalidades grande demais para uma especificação só.
---

# Iniciar projeto

Esta skill prepara o terreno e para. Ela não implementa nenhuma funcionalidade.

## 1. Criar a partir do modelo

Se a pasta da sessão já tem um projeto (um `AGENTS.md` na raiz), pule para o
passo 2. Se está vazia, rode, nela:

```
node "${CLAUDE_SKILL_DIR}/iniciar.mjs" . "<nome do projeto>"
```

O script copia o modelo de projeto, instala as dependências, roda a
verificação e faz o primeiro commit. Se ele falhar, mostre a mensagem ao
usuário e pare.

## 2. Dividir o pedido

Se o pedido cabe numa sessão, pare aqui e siga com a skill `especificar`.
Cabe quando uma única especificação dá conta dele, com até seis fatias, como
uma API pequena de poucas operações. Se não cabe, escreva
`docs/funcionalidades.json`:

```json
[
  { "id": "F1", "descricao": "Cadastro de clientes: criar e consultar", "passa": false },
  { "id": "F2", "descricao": "...", "passa": false }
]
```

- Cada funcionalidade cabe numa sessão: uma especificação de poucas fatias,
  em geral de um módulo só.
- Em ordem de dependência: o que outra funcionalidade usa vem antes dela.
- A descrição diz o comportamento que o usuário vê, não a implementação.
- Todas começam com `"passa": false`. Depois, só se muda o `passa`, e só para
  `true`, com o verificador aprovando. Não apague nem reescreva uma
  funcionalidade sem o usuário pedir.

## 3. Registrar e parar

Crie `docs/progresso.md`, ou acrescente a ele, esta entrada:

```markdown
# Progresso

## <data> — iniciar-projeto
- Feito: projeto criado do modelo (ou: lista para o projeto existente); lista com <N> funcionalidades.
- Verificação: passando.
- Próximo passo: F1, depois de o usuário aprovar a lista.
```

Faça commit dos dois arquivos, mostre a lista ao usuário e pare: ela precisa
da aprovação dele. A primeira funcionalidade começa numa sessão nova.
