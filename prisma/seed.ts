import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hashSenha(senha: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(senha, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

const CATEGORIAS: { nome: string; tipo: string; grupoDre: string }[] = [
  { nome: "Vendas no balcão", tipo: "ENTRADA", grupoDre: "RECEITA_BRUTA" },
  { nome: "Delivery (apps)", tipo: "ENTRADA", grupoDre: "RECEITA_BRUTA" },
  { nome: "Delivery próprio", tipo: "ENTRADA", grupoDre: "RECEITA_BRUTA" },
  { nome: "Outras receitas", tipo: "ENTRADA", grupoDre: "OUTRA_RECEITA" },
  { nome: "Taxa de aplicativos (iFood etc.)", tipo: "SAIDA", grupoDre: "DEDUCAO" },
  { nome: "Taxa de cartão / maquininha", tipo: "SAIDA", grupoDre: "DEDUCAO" },
  { nome: "Impostos sobre vendas (Simples)", tipo: "SAIDA", grupoDre: "DEDUCAO" },
  { nome: "Insumos / Ingredientes", tipo: "SAIDA", grupoDre: "CMV" },
  { nome: "Bebidas", tipo: "SAIDA", grupoDre: "CMV" },
  { nome: "Embalagens / Descartáveis", tipo: "SAIDA", grupoDre: "CMV" },
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

const FORMAS_PAGAMENTO: { slug: string; nome: string; percentualCentesimos: number }[] = [
  { slug: "dinheiro",      nome: "Dinheiro",          percentualCentesimos: 0 },
  { slug: "pix",           nome: "PIX",               percentualCentesimos: 0 },
  { slug: "debito",        nome: "Cartão de Débito",  percentualCentesimos: 0 },
  { slug: "credito",       nome: "Cartão de Crédito", percentualCentesimos: 0 },
  { slug: "voucher",       nome: "Voucher / Vale",    percentualCentesimos: 0 },
  { slug: "ifood",         nome: "iFood",             percentualCentesimos: 0 },
  { slug: "99food",        nome: "99Food",            percentualCentesimos: 0 },
  { slug: "boleto",        nome: "Boleto",            percentualCentesimos: 0 },
  { slug: "transferencia", nome: "Transferência",     percentualCentesimos: 0 },
];

async function main() {
  const EMAIL = "demo@caixafood.com";
  const existente = await prisma.usuario.findUnique({ where: { email: EMAIL } });
  if (existente) {
    console.log("Usuário demo já existe — seed ignorado.");
    return;
  }

  const usuario = await prisma.usuario.create({
    data: { email: EMAIL, senhaHash: hashSenha("demo1234") },
  });

  const estab = await prisma.estabelecimento.create({
    data: { nome: "Meu Estabelecimento", tipo: "hamburgueria", usuarioId: usuario.id },
  });

  await prisma.categoria.createMany({
    data: CATEGORIAS.map((c) => ({ ...c, estabelecimentoId: estab.id })),
  });

  await prisma.formaPagamento.createMany({
    data: FORMAS_PAGAMENTO.map((f) => ({ ...f, estabelecimentoId: estab.id })),
  });

  console.log(`Usuário demo (${EMAIL} / demo1234) e estabelecimento criados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
