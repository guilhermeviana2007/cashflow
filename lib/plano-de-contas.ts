import type { PrismaClient } from "@prisma/client";

export const FORMAS_PAGAMENTO_PADRAO: {
  slug: string;
  nome: string;
  percentualCentesimos: number;
}[] = [
  { slug: "dinheiro",      nome: "Dinheiro",           percentualCentesimos: 0 },
  { slug: "pix",           nome: "PIX",                percentualCentesimos: 0 },
  { slug: "debito",        nome: "Cartão de Débito",   percentualCentesimos: 0 },
  { slug: "credito",       nome: "Cartão de Crédito",  percentualCentesimos: 0 },
  { slug: "voucher",       nome: "Voucher / Vale",      percentualCentesimos: 0 },
  { slug: "boleto",        nome: "Boleto",             percentualCentesimos: 0 },
  { slug: "transferencia", nome: "Transferência",      percentualCentesimos: 0 },
];

// Marketplaces de delivery pré-definidos para sugerir ao usuário.
export const MARKETPLACES_SUGERIDOS = [
  "iFood",
  "99Food",
  "Rappi",
  "Uber Eats",
  "Zé Delivery",
];

// Plano de contas padrão para food-service.
// grupoDre define onde cada lançamento entra no Demonstrativo de Resultado.
export const CATEGORIAS_PADRAO: {
  nome: string;
  tipo: "ENTRADA" | "SAIDA";
  grupoDre: string;
}[] = [
  // Receitas (entradas)
  { nome: "Vendas no balcão", tipo: "ENTRADA", grupoDre: "RECEITA_BRUTA" },
  { nome: "Delivery (apps)", tipo: "ENTRADA", grupoDre: "RECEITA_BRUTA" },
  { nome: "Delivery próprio", tipo: "ENTRADA", grupoDre: "RECEITA_BRUTA" },
  { nome: "Outras receitas", tipo: "ENTRADA", grupoDre: "OUTRA_RECEITA" },

  // Deduções da receita (saídas que reduzem o faturamento)
  { nome: "Taxa de aplicativos (iFood etc.)", tipo: "SAIDA", grupoDre: "DEDUCAO" },
  { nome: "Taxa de cartão / maquininha", tipo: "SAIDA", grupoDre: "DEDUCAO" },
  { nome: "Impostos sobre vendas (Simples)", tipo: "SAIDA", grupoDre: "DEDUCAO" },

  // CMV — custo das mercadorias vendidas (saídas)
  { nome: "Insumos / Ingredientes", tipo: "SAIDA", grupoDre: "CMV" },
  { nome: "Bebidas", tipo: "SAIDA", grupoDre: "CMV" },
  { nome: "Embalagens / Descartáveis", tipo: "SAIDA", grupoDre: "CMV" },

  // Despesas operacionais (saídas)
  { nome: "Aluguel", tipo: "SAIDA", grupoDre: "DESPESA_OPERACIONAL" },
  { nome: "Energia elétrica", tipo: "SAIDA", grupoDre: "DESPESA_OPERACIONAL" },
  { nome: "Água", tipo: "SAIDA", grupoDre: "DESPESA_OPERACIONAL" },
  { nome: "Gás", tipo: "SAIDA", grupoDre: "DESPESA_OPERACIONAL" },
  { nome: "Salários e encargos", tipo: "SAIDA", grupoDre: "DESPESA_OPERACIONAL" },
  { nome: "Marketing / Anúncios", tipo: "SAIDA", grupoDre: "DESPESA_OPERACIONAL" },
  { nome: "Manutenção / Limpeza", tipo: "SAIDA", grupoDre: "DESPESA_OPERACIONAL" },
  { nome: "Internet / Telefone", tipo: "SAIDA", grupoDre: "DESPESA_OPERACIONAL" },
  { nome: "Outras despesas", tipo: "SAIDA", grupoDre: "OUTRA_DESPESA" },
];

// Cria um estabelecimento para o usuário e já popula o plano de contas.
// Recebe o cliente do Prisma por parâmetro para funcionar tanto no app quanto em scripts.
export async function criarEstabelecimentoComCategorias(
  db: PrismaClient,
  usuarioId: string,
  nome: string,
  tipo: string
) {
  const estab = await db.estabelecimento.create({
    data: { nome, tipo, usuarioId },
  });
  await db.categoria.createMany({
    data: CATEGORIAS_PADRAO.map((c) => ({ ...c, estabelecimentoId: estab.id })),
  });
  await db.formaPagamento.createMany({
    data: FORMAS_PAGAMENTO_PADRAO.map((f) => ({ ...f, estabelecimentoId: estab.id })),
  });
  return estab;
}
