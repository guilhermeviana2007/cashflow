"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";

function numero(texto: string): number {
  const n = Number(String(texto).replace(",", ".").trim());
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function tipoValido(t: string): "INDUSTRIALIZADO" | "INSUMO" {
  return t === "INSUMO" ? "INSUMO" : "INDUSTRIALIZADO";
}

export async function criarProduto(formData: FormData) {
  const estab = await getEstabelecimentoAtual();
  const nome = String(formData.get("nome") || "").trim();
  if (!nome) return;

  await prisma.produtoEstoque.create({
    data: {
      nome,
      tipo: tipoValido(String(formData.get("tipo") || "")),
      unidade: String(formData.get("unidade") || "un").trim() || "un",
      quantidadeAtual: numero(String(formData.get("quantidadeAtual") || "0")),
      quantidadeIdeal: numero(String(formData.get("quantidadeIdeal") || "0")),
      estabelecimentoId: estab.id,
    },
  });
  revalidatePath("/estoque");
}

// Atualiza só a contagem do dia (quantidade atual).
export async function atualizarQuantidade(formData: FormData) {
  const estab = await getEstabelecimentoAtual();
  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.produtoEstoque.updateMany({
    where: { id, estabelecimentoId: estab.id },
    data: { quantidadeAtual: numero(String(formData.get("quantidadeAtual") || "0")) },
  });
  revalidatePath("/estoque");
}

export async function editarProduto(formData: FormData) {
  const estab = await getEstabelecimentoAtual();
  const id = String(formData.get("id") || "");
  const nome = String(formData.get("nome") || "").trim();
  if (!id || !nome) return;

  await prisma.produtoEstoque.updateMany({
    where: { id, estabelecimentoId: estab.id },
    data: {
      nome,
      tipo: tipoValido(String(formData.get("tipo") || "")),
      unidade: String(formData.get("unidade") || "un").trim() || "un",
      quantidadeIdeal: numero(String(formData.get("quantidadeIdeal") || "0")),
      quantidadeAtual: numero(String(formData.get("quantidadeAtual") || "0")),
    },
  });
  revalidatePath("/estoque");
}

export async function excluirProduto(formData: FormData) {
  const estab = await getEstabelecimentoAtual();
  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.produtoEstoque.deleteMany({
    where: { id, estabelecimentoId: estab.id },
  });
  revalidatePath("/estoque");
}
