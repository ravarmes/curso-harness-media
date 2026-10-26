// O que `receitas` pergunta aos outros módulos; o app.ts entrega as respostas
// vindas dos index.ts de `cardapio` e `estoque`.
export type Dependencias = {
  existeItem: (id: number) => boolean;
  nomeDoIngrediente: (id: number) => string | undefined;
};

export type Receita = {
  itemId: number;
  ingredientes: { ingredienteId: number; nome: string; quantidade: number }[];
};
