import { prisma } from "./prisma";

type EstabSaldo = {
  id: string;
  saldoInicialCentavos: number;
  saldoInicialData: Date | null;
};

// Saldo atual do caixa = saldo inicial + soma líquida de todos os lançamentos
// desde a data inicial configurada. Entradas valem (valorBruto - taxa), saídas valem o valor cheio.
export async function calcularSaldoAtual(estab: EstabSaldo): Promise<number> {
  const lancamentos = await prisma.lancamento.findMany({
    where: {
      estabelecimentoId: estab.id,
      ...(estab.saldoInicialData ? { data: { gte: estab.saldoInicialData } } : {}),
    },
    select: {
      tipo: true,
      valorCentavos: true,
      taxaDescontadaCentavos: true,
    },
  });

  let saldo = estab.saldoInicialCentavos;
  for (const l of lancamentos) {
    if (l.tipo === "ENTRADA") {
      saldo += l.valorCentavos - l.taxaDescontadaCentavos;
    } else {
      saldo -= l.valorCentavos;
    }
  }
  return saldo;
}
