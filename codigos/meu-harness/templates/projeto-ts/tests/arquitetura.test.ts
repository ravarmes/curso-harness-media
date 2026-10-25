// Teste de arquitetura: confere as regras de docs/arquitetura.md.
// Cada mensagem diz ao agente o que está errado e como corrigir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

const SRC = resolve(import.meta.dirname, '../src');
const rel = (caminho: string) => relative(SRC, caminho).split(sep).join('/');

function arquivosTs(pasta = SRC): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return arquivosTs(caminho);
    return caminho.endsWith('.ts') ? [caminho] : [];
  });
}

// Imports de um arquivo; os relativos viram caminhos a partir de src/.
function importsDe(arquivo: string): string[] {
  const texto = readFileSync(arquivo, 'utf8');
  return [...texto.matchAll(/^import\s[^;]*?from\s+'([^']+)'/gm)].map(([, alvo]) =>
    alvo.startsWith('.') ? rel(resolve(dirname(arquivo), alvo)) : alvo);
}

function falhas(regra: (arquivo: string, alvo: string) => string | undefined): string[] {
  return arquivosTs().flatMap((arq) => importsDe(arq).map((alvo) => regra(rel(arq), alvo))).filter((m) => m !== undefined);
}

test('regra 1: um módulo usa outro só pelo index.ts dele', () => {
  assert.deepEqual(falhas((arq, alvo) => {
    const [, origem] = arq.split('/');
    const [raiz, destino, ...resto] = alvo.split('/');
    if (!arq.startsWith('modulos/') || raiz !== 'modulos' || destino === origem) return;
    if (resto.join('/') !== 'index.ts') {
      return `${arq} importa ${alvo}. Um módulo só usa outro pelo index.ts: importe de `
        + `modulos/${destino}/index.ts e, se faltar algo lá, exporte pelo index.ts de ${destino}.`;
    }
  }), []);
});

test('regra 2: compartilhado/ não importa nada de modulos/', () => {
  assert.deepEqual(falhas((arq, alvo) => {
    if (arq.startsWith('compartilhado/') && alvo.startsWith('modulos/')) {
      return `${arq} importa ${alvo}. compartilhado/ é infraestrutura comum e não pode depender de `
        + 'nenhum módulo: mova esse código para dentro do módulo que o usa.';
    }
  }), []);
});

test('regra 3: a regra de negócio não importa HTTP, e a rota não importa o repositório', () => {
  assert.deepEqual(falhas((arq, alvo) => {
    const partes = arq.split('/');
    const ehFatia = partes[0] === 'modulos' && partes.length === 4;
    const ehRegra = ehFatia && partes[3] === `${partes[2]}.ts`;
    if (ehRegra && (alvo === 'node:http' || alvo === 'compartilhado/http.ts')) {
      return `${arq} importa ${alvo}. A regra de negócio não conhece HTTP: receba dados simples, `
        + 'devolva { ok, ... } e deixe a tradução para HTTP em rota.ts.';
    }
    if (ehFatia && partes[3] === 'rota.ts' && alvo.endsWith('/repositorio.ts')) {
      return `${arq} importa ${alvo}. A rota não acessa o banco: ela chama a regra da fatia, que `
        + 'recebe o repositório pelo index.ts do módulo.';
    }
  }), []);
});

test('regra 4: toda fatia tem o seu arquivo de teste', () => {
  const pastaModulos = join(SRC, 'modulos');
  const ehPasta = (caminho: string) => statSync(caminho).isDirectory();
  // Projeto recém-criado do modelo ainda não tem módulo: não há o que conferir.
  const modulos = existsSync(pastaModulos) ? readdirSync(pastaModulos).filter((m) => ehPasta(join(pastaModulos, m))) : [];
  const semTeste = modulos.flatMap((modulo) =>
    readdirSync(join(pastaModulos, modulo))
      .filter((fatia) => statSync(join(pastaModulos, modulo, fatia)).isDirectory())
      .filter((fatia) => !existsSync(join(pastaModulos, modulo, fatia, `${fatia}.test.ts`)))
      .map((fatia) => `modulos/${modulo}/${fatia}/ não tem ${fatia}.test.ts. Toda fatia testa a sua `
        + 'regra de negócio, inclusive os casos de recusa, num arquivo ao lado dela.'));
  assert.deepEqual(semTeste, []);
});
