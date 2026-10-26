import { abrirBanco } from './compartilhado/banco.ts';
import { criarServidor } from './compartilhado/http.ts';
import { moduloBairros } from './modulos/bairros/index.ts';
import { moduloCardapio } from './modulos/cardapio/index.ts';
import { moduloCupons } from './modulos/cupons/index.ts';
import { moduloEstoque } from './modulos/estoque/index.ts';
import { moduloNotas } from './modulos/notas/index.ts';
import { moduloPedidos } from './modulos/pedidos/index.ts';
import { moduloReceitas } from './modulos/receitas/index.ts';

// Composição: todo módulo novo é registrado aqui, e só aqui. O relógio entra
// por parâmetro para os testes controlarem o horário de funcionamento.
export function criarApp(banco = abrirBanco(), agora = () => new Date()) {
  const cardapio = moduloCardapio(banco);
  const estoque = moduloEstoque(banco);
  const bairros = moduloBairros(banco);
  const cupons = moduloCupons(banco);
  const receitas = moduloReceitas(banco, {
    existeItem: cardapio.existeItem,
    nomeDoIngrediente: estoque.nomeDoIngrediente,
  });
  const pedidos = moduloPedidos(banco, {
    agora,
    precoDoItem: cardapio.precoDoItem,
    taxaDoBairro: bairros.taxaDoBairro,
    receitaDoItem: receitas.receitaDoItem,
    ingredienteNoEstoque: estoque.ingredienteNoEstoque,
    baixarEstoque: estoque.baixarEstoque,
  });
  return criarServidor([
    ...moduloNotas(banco).rotas,
    ...bairros.rotas,
    ...cupons.rotas,
    ...cardapio.rotas,
    ...estoque.rotas,
    ...receitas.rotas,
    ...pedidos.rotas,
  ]);
}
