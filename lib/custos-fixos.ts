import { prisma } from "@/lib/prisma";

// Gera lançamentos dos custos fixos que já venceram neste mês e ainda não
// foram criados. Idempotente — pode ser chamada a cada render sem duplicar.
export async function gerarCustosFixosDoMes(estabelecimentoId: string) {
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

  const custosAtivos = await prisma.custoFixo.findMany({
    where: { estabelecimentoId, ativo: true, diaVencimento: { lte: diaHoje } },
  });

  if (custosAtivos.length === 0) return;

  // Uma única query para saber quais já foram gerados neste mês
  const jaGerados = await prisma.lancamento.findMany({
    where: {
      custoFixoId: { in: custosAtivos.map((c) => c.id) },
      data: { gte: inicioMes, lte: fimMes },
    },
    select: { custoFixoId: true },
  });
  const idsGerados = new Set(jaGerados.map((l) => l.custoFixoId));

  const faltam = custosAtivos.filter((c) => !idsGerados.has(c.id));
  if (faltam.length === 0) return;

  await prisma.lancamento.createMany({
    data: faltam.map((custo) => ({
      tipo: "SAIDA",
      descricao: custo.nome,
      valorCentavos: custo.valorCentavos,
      data: new Date(hoje.getFullYear(), hoje.getMonth(), custo.diaVencimento, 12, 0, 0),
      categoriaId: custo.categoriaId,
      origem: "CUSTO_FIXO",
      status: "CONFIRMADO",
      estabelecimentoId,
      custoFixoId: custo.id,
    })),
  });
}
