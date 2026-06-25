import { prisma } from "@/lib/prisma";

// Verifica quais custos fixos ativos já venceram no mês atual e ainda não têm
// lançamento gerado. Cria os que faltam. Função idempotente — pode ser chamada
// a cada render sem criar duplicatas.
export async function gerarCustosFixosDoMes(estabelecimentoId: string) {
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

  const custosAtivos = await prisma.custoFixo.findMany({
    where: {
      estabelecimentoId,
      ativo: true,
      diaVencimento: { lte: diaHoje },
    },
  });

  for (const custo of custosAtivos) {
    const existente = await prisma.lancamento.findFirst({
      where: {
        custoFixoId: custo.id,
        data: { gte: inicioMes, lte: fimMes },
      },
    });

    if (!existente) {
      await prisma.lancamento.create({
        data: {
          tipo: "SAIDA",
          descricao: custo.nome,
          valorCentavos: custo.valorCentavos,
          data: new Date(hoje.getFullYear(), hoje.getMonth(), custo.diaVencimento, 12, 0, 0),
          categoriaId: custo.categoriaId,
          origem: "CUSTO_FIXO",
          status: "CONFIRMADO",
          estabelecimentoId,
          custoFixoId: custo.id,
        },
      });
    }
  }
}
