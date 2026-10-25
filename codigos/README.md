# Código do curso Harness Engineering

Ao longo do curso, você constrói duas coisas ao mesmo tempo:

- **`meu-harness/`**, o seu harness: instruções, skills, hooks, subagentes, um servidor
  MCP e, no fim, o plugin que instala tudo;
- **`consultorio/`**, a API da agenda de um consultório, construída com esse harness,
  capítulo a capítulo.

Cada capítulo tem uma **branch** com o estado das duas pastas no fim da prática guiada
daquele capítulo. As branches têm só código e cada uma nasce da anterior. Por isso, o
"compare" do GitHub mostra exatamente o que um capítulo acrescentou. Dentro de cada
branch, cada passo da prática guiada é um commit.

| Capítulo | Branch | Ver | Baixar | O que mudou |
|---|---|---|---|---|
| 1. O que é um harness | `cap-01` | [árvore](https://github.com/ravarmes/curso-harness-media/tree/cap-01/codigos) | [zip](https://github.com/ravarmes/curso-harness-media/archive/refs/heads/cap-01.zip) | — |
| 2. Engenharia de contexto | `cap-02` | [árvore](https://github.com/ravarmes/curso-harness-media/tree/cap-02/codigos) | [zip](https://github.com/ravarmes/curso-harness-media/archive/refs/heads/cap-02.zip) | [cap-01...cap-02](https://github.com/ravarmes/curso-harness-media/compare/cap-01...cap-02) |
| 3. Arquitetura | `cap-03` | [árvore](https://github.com/ravarmes/curso-harness-media/tree/cap-03/codigos) | [zip](https://github.com/ravarmes/curso-harness-media/archive/refs/heads/cap-03.zip) | [cap-02...cap-03](https://github.com/ravarmes/curso-harness-media/compare/cap-02...cap-03) |
| 4. Skills | `cap-04` | [árvore](https://github.com/ravarmes/curso-harness-media/tree/cap-04/codigos) | [zip](https://github.com/ravarmes/curso-harness-media/archive/refs/heads/cap-04.zip) | [cap-03...cap-04](https://github.com/ravarmes/curso-harness-media/compare/cap-03...cap-04) |
| 5. Hooks, permissões e segurança | `cap-05` | [árvore](https://github.com/ravarmes/curso-harness-media/tree/cap-05/codigos) | [zip](https://github.com/ravarmes/curso-harness-media/archive/refs/heads/cap-05.zip) | [cap-04...cap-05](https://github.com/ravarmes/curso-harness-media/compare/cap-04...cap-05) |
| 6. Subagentes | `cap-06` | [árvore](https://github.com/ravarmes/curso-harness-media/tree/cap-06/codigos) | [zip](https://github.com/ravarmes/curso-harness-media/archive/refs/heads/cap-06.zip) | [cap-05...cap-06](https://github.com/ravarmes/curso-harness-media/compare/cap-05...cap-06) |
| 7. MCP | `cap-07` | [árvore](https://github.com/ravarmes/curso-harness-media/tree/cap-07/codigos) | [zip](https://github.com/ravarmes/curso-harness-media/archive/refs/heads/cap-07.zip) | [cap-06...cap-07](https://github.com/ravarmes/curso-harness-media/compare/cap-06...cap-07) |
| 8. O harness em ação | `cap-08` | [árvore](https://github.com/ravarmes/curso-harness-media/tree/cap-08/codigos) | [zip](https://github.com/ravarmes/curso-harness-media/archive/refs/heads/cap-08.zip) | [cap-07...cap-08](https://github.com/ravarmes/curso-harness-media/compare/cap-07...cap-08) |
| Projeto final: a lanchonete | `projeto-final` | [árvore](https://github.com/ravarmes/curso-harness-media/tree/projeto-final/codigos) | [zip](https://github.com/ravarmes/curso-harness-media/archive/refs/heads/projeto-final.zip) | [cap-08...projeto-final](https://github.com/ravarmes/curso-harness-media/compare/cap-08...projeto-final) |

## Como usar

**Baixar um capítulo:** o link "zip" traz a branch inteira. Descompacte e abra a pasta
`codigos/`. Cada branch tem um `codigos/LEIA-ME.md` que diz o que mudou e como rodar.

**Com Git:**

```bash
git clone --branch cap-04 --single-branch https://github.com/ravarmes/curso-harness-media.git
```

**Comparar com o seu:** a rodada que você fizer com o agente vai sair diferente da que
está aqui, porque o modelo não responde igual duas vezes. A branch é a referência para
comparar, não o gabarito que o seu código precisa repetir. O texto de cada capítulo diz
no que vale reparar.
