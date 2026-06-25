"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { reaisParaCentavos } from "@/lib/format";

export async function salvarSaldoInicial(formData: FormData) {
  const estab = await getEstabelecimentoAtual();

  const valorTexto = String(formData.get("saldoInicial") || "0");
  const dataTexto = String(formData.get("saldoInicialData") || "");

  const saldoInicialCentavos = reaisParaCentavos(valorTexto);
  const saldoInicialData = dataTexto ? new Date(dataTexto + "T00:00:00") : null;

  await prisma.estabelecimento.update({
    where: { id: estab.id },
    data: { saldoInicialCentavos, saldoInicialData },
  });

  revalidatePath("/configuracoes");
  revalidatePath("/");
  revalidatePath("/lancamentos");
  revalidatePath("/relatorios");
}

export async function salvarTaxas(formData: FormData) {
  const estab = await getEstabelecimentoAtual();

  const formas = await prisma.formaPagamento.findMany({
    where: { estabelecimentoId: estab.id },
  });

  for (const forma of formas) {
    const raw = String(formData.get(`rate-${forma.id}`) || "0").replace(",", ".");
    const percentual = Number(raw);
    if (Number.isNaN(percentual) || percentual < 0) continue;
    const percentualCentesimos = Math.round(percentual * 100);

    await prisma.formaPagamento.update({
      where: { id: forma.id },
      data: { percentualCentesimos },
    });
  }

  revalidatePath("/configuracoes");
  revalidatePath("/relatorios");
}
