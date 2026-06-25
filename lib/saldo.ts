import { prisma } from "./prisma";

type EstabSaldo = {
  id: string;
  saldoInicialCentavos: number;
  saldoInicialData: Date | null;
};

export async function calcularSaldoAtual(estab: EstabSaldo): Promise<number> {
  const where = {
    estabelecimentoId: estab.id,
    ...(estab.saldoInicialData ? { data: { gte: estab.saldoInicialData } } : {}),
  };

  const [entradas, saidas] = await Promise.all([
    prisma.lancamento.aggregate({
      where: { ...where, tipo: "ENTRADA" },
      _sum: { valorCentavos: true, taxaDescontadaCentavos: true },
    }),
    prisma.lancamento.aggregate({
      where: { ...where, tipo: "SAIDA" },
      _sum: { valorCentavos: true },
    }),
  ]);

  return (
    estab.saldoInicialCentavos +
    (entradas._sum.valorCentavos ?? 0) -
    (entradas._sum.taxaDescontadaCentavos ?? 0) -
    (saidas._sum.valorCentavos ?? 0)
  );
}
