"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { reaisParaCentavos } from "@/lib/format";

async function buscarTaxaCentavos(
  estabelecimentoId: string,
  slug: string | null,
  valorCentavos: number
): Promise<number> {
  if (!slug) return 0;
  const forma = await prisma.formaPagamento.findFirst({
    where: { estabelecimentoId, slug },
    select: { percentualCentesimos: true },
  });
  if (!forma || forma.percentualCentesimos <= 0) return 0;
  return Math.round((valorCentavos * forma.percentualCentesimos) / 10000);
}

export async function criarLancamento(formData: FormData) {
  const estab = await getEstabelecimentoAtual();

  const tipo = String(formData.get("tipo") || "");
  const descricao = String(formData.get("descricao") || "").trim();
  const valorTexto = String(formData.get("valor") || "");
  const dataTexto = String(formData.get("data") || "");
  const categoriaId = String(formData.get("categoriaId") || "") || null;
  const fornecedor = String(formData.get("fornecedor") || "").trim() || null;
  const formaPagamento = String(formData.get("formaPagamento") || "") || null;

  if (tipo !== "ENTRADA" && tipo !== "SAIDA") {
    throw new Error("Tipo inválido.");
  }
  const valorCentavos = reaisParaCentavos(valorTexto);
  if (valorCentavos <= 0) {
    throw new Error("Informe um valor maior que zero.");
  }
  if (!descricao) {
    throw new Error("Informe uma descrição.");
  }

  const taxaDescontadaCentavos =
    tipo === "ENTRADA"
      ? await buscarTaxaCentavos(estab.id, formaPagamento, valorCentavos)
      : 0;

  await prisma.lancamento.create({
    data: {
      tipo,
      descricao,
      valorCentavos,
      taxaDescontadaCentavos,
      data: dataTexto ? new Date(dataTexto + "T12:00:00") : new Date(),
      categoriaId,
      fornecedor,
      formaPagamento,
      origem: "MANUAL",
      status: "CONFIRMADO",
      estabelecimentoId: estab.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/lancamentos");
  redirect("/lancamentos");
}

export async function editarLancamento(formData: FormData) {
  const estab = await getEstabelecimentoAtual();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("ID inválido.");

  const tipo = String(formData.get("tipo") || "");
  const descricao = String(formData.get("descricao") || "").trim();
  const valorTexto = String(formData.get("valor") || "");
  const dataTexto = String(formData.get("data") || "");
  const categoriaId = String(formData.get("categoriaId") || "") || null;
  const fornecedor = String(formData.get("fornecedor") || "").trim() || null;
  const formaPagamento = String(formData.get("formaPagamento") || "") || null;

  if (tipo !== "ENTRADA" && tipo !== "SAIDA") throw new Error("Tipo inválido.");
  const valorCentavos = reaisParaCentavos(valorTexto);
  if (valorCentavos <= 0) throw new Error("Informe um valor maior que zero.");
  if (!descricao) throw new Error("Informe uma descrição.");

  const taxaDescontadaCentavos =
    tipo === "ENTRADA"
      ? await buscarTaxaCentavos(estab.id, formaPagamento, valorCentavos)
      : 0;

  await prisma.lancamento.updateMany({
    where: { id, estabelecimentoId: estab.id },
    data: {
      tipo,
      descricao,
      valorCentavos,
      taxaDescontadaCentavos,
      data: dataTexto ? new Date(dataTexto + "T12:00:00") : new Date(),
      categoriaId,
      fornecedor,
      formaPagamento,
    },
  });

  revalidatePath("/");
  revalidatePath("/lancamentos");
  redirect("/lancamentos");
}

export async function excluirLancamento(formData: FormData) {
  const estab = await getEstabelecimentoAtual();
  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.lancamento.deleteMany({
    where: { id, estabelecimentoId: estab.id },
  });

  revalidatePath("/");
  revalidatePath("/lancamentos");
}
