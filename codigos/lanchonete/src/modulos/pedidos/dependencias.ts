// O que `pedidos` pergunta aos outros módulos; o app.ts entrega as respostas
// vindas dos index.ts de `cardapio`, `bairros`, `cupons`, `receitas` e `estoque`.
export type Consumo = { ingredienteId: number; quantidade: number };

export type Dependencias = {
  agora: () => Date;
  precoDoItem: (id: number) => number | undefined;
  taxaDoBairro: (id: number) => number | undefined;
  cupomPorCodigo: (codigo: string) => { id: number; codigo: string; percentual: number } | undefined;
  receitaDoItem: (id: number) => Consumo[];
  ingredienteNoEstoque: (id: number) => { nome: string; quantidade: number } | undefined;
  baixarEstoque: (consumos: Consumo[]) => void;
};

export type Pedido = {
  id: number;
  clienteId: string;
  bairroId: number;
  itens: { itemId: number; quantidade: number; precoUnitario: number }[];
  cupom: string | null;
  subtotal: number;
  desconto: number;
  taxa: number;
  total: number;
};
