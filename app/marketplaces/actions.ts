"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { reaisParaCentavos } from "@/lib/format";

export async function salvarMarketplaces(formData: FormData) {
  const estab = await getEstabelecimentoAtual();
  const nomesSelecionados = formData.getAll("marketplace").map(String).filter(Boolean);

  const existentes = await prisma.marketplace.findMany({
    where: { estabelecimentoId: estab.id },
  });
  const existentesMap = new Map(existentes.map((m) => [m.nome, m]));

  // Desativa todos que existem
  await prisma.marketplace.updateMany({
    where: { estabelecimentoId: estab.id },
    data: { ativo: false },
  });

  // Ativa ou cria cada nome selecionado
  for (const nome of nomesSelecionados) {
    const existente = existentesMap.get(nome);
    if (existente) {
      await prisma.marketplace.update({ where: { id: existente.id }, data: { ativo: true } });
    } else {
      await prisma.marketplace.create({ data: { nome, ativo: true, estabelecimentoId: estab.id } });
    }
  }

  revalidatePath("/marketplaces");
}

export async function adicionarMarketplaceCustom(formData: FormData) {
  const estab = await getEstabelecimentoAtual();
  const nome = String(formData.get("nomeCustom") || "").trim();
  if (!nome) return;

  const existente = await prisma.marketplace.findFirst({
    where: { estabelecimentoId: estab.id, nome },
  });

  if (existente) {
    await prisma.marketplace.update({ where: { id: existente.id }, data: { ativo: true } });
  } else {
    await prisma.marketplace.create({ data: { nome, ativo: true, estabelecimentoId: estab.id } });
  }

  revalidatePath("/marketplaces");
}

export async function registrarRepasse(formData: FormData) {
  const estab = await getEstabelecimentoAtual();

  const marketplaceNome = String(formData.get("marketplace") || "").trim();
  const valorTexto = String(formData.get("valor") || "");
  const dataTexto = String(formData.get("data") || "");
  const periodo = String(formData.get("periodo") || "").trim();

  if (!marketplaceNome) throw new Error("Selecione um marketplace.");
  const valorCentavos = reaisParaCentavos(valorTexto);
  if (valorCentavos <= 0) throw new Error("Informe um valor maior que zero.");

  const descricao = periodo
    ? `Repasse ${marketplaceNome} — ${periodo}`
    : `Repasse ${marketplaceNome}`;

  const catDelivery = await prisma.categoria.findFirst({
    where: { estabelecimentoId: estab.id, tipo: "ENTRADA", nome: { contains: "Delivery" } },
    select: { id: true },
  });

  await prisma.lancamento.create({
    data: {
      tipo: "ENTRADA",
      descricao,
      valorCentavos,
      taxaDescontadaCentavos: 0,
      data: dataTexto ? new Date(dataTexto + "T12:00:00") : new Date(),
      fornecedor: marketplaceNome,
      origem: "MARKETPLACE",
      status: "CONFIRMADO",
      estabelecimentoId: estab.id,
      categoriaId: catDelivery?.id ?? null,
    },
  });

  revalidatePath("/marketplaces");
  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");
}

export async function excluirRepasse(formData: FormData) {
  const estab = await getEstabelecimentoAtual();
  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.lancamento.deleteMany({
    where: { id, estabelecimentoId: estab.id, origem: "MARKETPLACE" },
  });

  revalidatePath("/marketplaces");
  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
}
