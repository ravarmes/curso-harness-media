import { abrirBanco } from './compartilhado/banco.ts';
import { criarServidor } from './compartilhado/http.ts';
import { moduloCardapio } from './modulos/cardapio/index.ts';
import { moduloEstoque } from './modulos/estoque/index.ts';
import { moduloNotas } from './modulos/notas/index.ts';
import { moduloReceitas } from './modulos/receitas/index.ts';

// Composição: todo módulo novo é registrado aqui, e só aqui.
export function criarApp(banco = abrirBanco()) {
  const cardapio = moduloCardapio(banco);
  const estoque = moduloEstoque(banco);
  const receitas = moduloReceitas(banco, {
    existeItem: cardapio.existeItem,
    nomeDoIngrediente: estoque.nomeDoIngrediente,
  });
  return criarServidor([...moduloNotas(banco).rotas, ...cardapio.rotas, ...estoque.rotas, ...receitas.rotas]);
}
