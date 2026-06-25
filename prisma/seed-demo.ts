import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Gera lançamentos de exemplo dos últimos 45 dias para demonstração.
async function main() {
  const estab = await prisma.estabelecimento.findFirst();
  if (!estab) throw new Error("Rode antes: node prisma/seed.ts");

  const cats = await prisma.categoria.findMany({
    where: { estabelecimentoId: estab.id },
  });
  const cat = (nome: string) => cats.find((c) => c.nome === nome);

  // Limpa lançamentos demo anteriores
  await prisma.lancamento.deleteMany({ where: { estabelecimentoId: estab.id } });

  const dados: {
    tipo: "ENTRADA" | "SAIDA";
    descricao: string;
    valorCentavos: number;
    data: Date;
    categoriaId?: string;
  }[] = [];

  const hoje = new Date();
  const rnd = (min: number, max: number) => Math.round(min + Math.random() * (max - min));

  for (let i = 44; i >= 0; i--) {
    const dia = new Date(hoje);
    dia.setDate(dia.getDate() - i);
    dia.setHours(20, 0, 0, 0);
    const fimDeSemana = dia.getDay() === 0 || dia.getDay() === 6;
    const mult = fimDeSemana ? 1.6 : 1;

    // Vendas diárias
    dados.push({
      tipo: "ENTRADA",
      descricao: "Vendas no balcão",
      valorCentavos: Math.round(rnd(45000, 90000) * mult),
      data: dia,
      categoriaId: cat("Vendas no balcão")?.id,
    });
    dados.push({
      tipo: "ENTRADA",
      descricao: "Delivery iFood",
      valorCentavos: Math.round(rnd(30000, 70000) * mult),
      data: dia,
      categoriaId: cat("Delivery (apps)")?.id,
    });

    // Taxa do app (dedução) — ~25% do delivery
    const delivery = dados[dados.length - 1].valorCentavos;
    dados.push({
      tipo: "SAIDA",
      descricao: "Taxa iFood",
      valorCentavos: Math.round(delivery * 0.25),
      data: dia,
      categoriaId: cat("Taxa de aplicativos (iFood etc.)")?.id,
    });

    // Compras de insumos (2-3x por semana)
    if (i % 3 === 0) {
      dados.push({
        tipo: "SAIDA",
        descricao: "Compra de carne e pães",
        valorCentavos: rnd(35000, 65000),
        data: dia,
        categoriaId: cat("Insumos / Ingredientes")?.id,
      });
      dados.push({
        tipo: "SAIDA",
        descricao: "Bebidas e refrigerantes",
        valorCentavos: rnd(12000, 25000),
        data: dia,
        categoriaId: cat("Bebidas")?.id,
      });
      dados.push({
        tipo: "SAIDA",
        descricao: "Embalagens",
        valorCentavos: rnd(6000, 14000),
        data: dia,
        categoriaId: cat("Embalagens / Descartáveis")?.id,
      });
    }
  }

  // Despesas fixas mensais (lançadas no início do período)
  const inicioMes = new Date(hoje);
  inicioMes.setDate(hoje.getDate() - 40);
  const fixas: [string, number, string][] = [
    ["Aluguel", 350000, "Aluguel"],
    ["Conta de energia", 85000, "Energia elétrica"],
    ["Salários equipe", 680000, "Salários e encargos"],
    ["Gás", 42000, "Gás"],
    ["Anúncios Instagram", 30000, "Marketing / Anúncios"],
  ];
  for (const [desc, valor, catNome] of fixas) {
    dados.push({
      tipo: "SAIDA",
      descricao: desc,
      valorCentavos: valor,
      data: inicioMes,
      categoriaId: cat(catNome)?.id,
    });
  }

  await prisma.lancamento.createMany({
    data: dados.map((d) => ({
      ...d,
      origem: "MANUAL",
      status: "CONFIRMADO",
      estabelecimentoId: estab.id,
    })),
  });

  console.log(`${dados.length} lançamentos de exemplo criados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
