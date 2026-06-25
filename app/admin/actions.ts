"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirAdmin, ehAdmin, iniciarVerComo } from "@/lib/auth";
import { reaisParaCentavos } from "@/lib/format";
import {
  garantirAssinatura,
  proximoVencimentoAposPagamento,
  PLANOS,
} from "@/lib/assinatura";

// Registra um pagamento: estende o vencimento conforme o plano e reativa a conta.
export async function registrarPagamento(formData: FormData) {
  await exigirAdmin();
  const assinaturaId = String(formData.get("assinaturaId") || "");
  if (!assinaturaId) return;

  const assinatura = await prisma.assinatura.findUnique({ where: { id: assinaturaId } });
  if (!assinatura) return;

  const valorTexto = String(formData.get("valor") || "").trim();
  const valorCentavos = valorTexto
    ? reaisParaCentavos(valorTexto)
    : assinatura.valorCentavos;

  const novoVencimento = proximoVencimentoAposPagamento(
    assinatura.proximoVencimento,
    assinatura.plano
  );

  await prisma.$transaction([
    prisma.pagamento.create({
      data: {
        assinaturaId,
        valorCentavos,
        referencia: String(formData.get("referencia") || "").trim() || null,
      },
    }),
    prisma.assinatura.update({
      where: { id: assinaturaId },
      data: { proximoVencimento: novoVencimento, status: "ATIVA" },
    }),
  ]);

  revalidatePath("/admin");
}

export async function pausarAssinatura(formData: FormData) {
  await exigirAdmin();
  const usuarioId = String(formData.get("usuarioId") || "");
  if (!usuarioId) return;

  const alvo = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!alvo || ehAdmin(alvo.email)) return; // nunca pausa um admin

  const a = await garantirAssinatura(usuarioId);
  await prisma.assinatura.update({ where: { id: a.id }, data: { status: "PAUSADA" } });
  revalidatePath("/admin");
}

export async function reativarAssinatura(formData: FormData) {
  await exigirAdmin();
  const usuarioId = String(formData.get("usuarioId") || "");
  if (!usuarioId) return;

  const a = await garantirAssinatura(usuarioId);
  await prisma.assinatura.update({ where: { id: a.id }, data: { status: "ATIVA" } });
  revalidatePath("/admin");
}

// Edita valor, plano e data de vencimento da assinatura.
export async function editarAssinatura(formData: FormData) {
  await exigirAdmin();
  const usuarioId = String(formData.get("usuarioId") || "");
  if (!usuarioId) return;

  const plano = String(formData.get("plano") || "MENSAL");
  const planoValido = PLANOS.some((p) => p.v === plano) ? plano : "MENSAL";
  const valorCentavos = reaisParaCentavos(String(formData.get("valor") || "0"));
  const dataTexto = String(formData.get("proximoVencimento") || "");

  const a = await garantirAssinatura(usuarioId);
  await prisma.assinatura.update({
    where: { id: a.id },
    data: {
      plano: planoValido,
      valorCentavos,
      ...(dataTexto ? { proximoVencimento: new Date(dataTexto + "T12:00:00") } : {}),
    },
  });
  revalidatePath("/admin");
}

// Remove permanentemente a conta do cliente (cascata apaga tudo).
export async function removerConta(formData: FormData) {
  const admin = await exigirAdmin();
  const usuarioId = String(formData.get("usuarioId") || "");
  if (!usuarioId) return;

  const alvo = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!alvo) return;
  if (alvo.id === admin.id) return; // não remove a si mesmo
  if (ehAdmin(alvo.email)) return; // não remove outro admin

  await prisma.usuario.delete({ where: { id: usuarioId } });
  revalidatePath("/admin");
}

// Inicia a visualização "como cliente" e leva ao painel do cliente.
export async function verComoCliente(formData: FormData) {
  await exigirAdmin();
  const usuarioId = String(formData.get("usuarioId") || "");
  if (!usuarioId) return;
  await iniciarVerComo(usuarioId);
  redirect("/");
}
