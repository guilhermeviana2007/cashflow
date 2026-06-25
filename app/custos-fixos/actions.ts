"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { reaisParaCentavos } from "@/lib/format";

export async function criarCustoFixo(formData: FormData) {
  const estab = await getEstabelecimentoAtual();

  const nome = String(formData.get("nome") || "").trim();
  const valorTexto = String(formData.get("valor") || "");
  const diaTexto = String(formData.get("diaVencimento") || "");
  const categoriaId = String(formData.get("categoriaId") || "") || null;

  if (!nome) throw new Error("Informe o nome do custo.");
  const valorCentavos = reaisParaCentavos(valorTexto);
  if (valorCentavos <= 0) throw new Error("Informe um valor maior que zero.");
  const diaVencimento = Number(diaTexto);
  if (!diaVencimento || diaVencimento < 1 || diaVencimento > 28) {
    throw new Error("Dia de vencimento deve ser entre 1 e 28.");
  }

  await prisma.custoFixo.create({
    data: {
      nome,
      valorCentavos,
      diaVencimento,
      categoriaId,
      estabelecimentoId: estab.id,
    },
  });

  revalidatePath("/custos-fixos");
  revalidatePath("/relatorios");
  redirect("/custos-fixos");
}

export async function toggleCustoFixo(formData: FormData) {
  const estab = await getEstabelecimentoAtual();
  const id = String(formData.get("id") || "");
  const ativoAtual = formData.get("ativo") === "true";

  await prisma.custoFixo.updateMany({
    where: { id, estabelecimentoId: estab.id },
    data: { ativo: !ativoAtual },
  });

  revalidatePath("/custos-fixos");
}

export async function excluirCustoFixo(formData: FormData) {
  const estab = await getEstabelecimentoAtual();
  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.custoFixo.deleteMany({
    where: { id, estabelecimentoId: estab.id },
  });

  revalidatePath("/custos-fixos");
  revalidatePath("/relatorios");
}
