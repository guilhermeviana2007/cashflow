"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/auth";
import {
  ehPlano,
  ehServico,
  servicoPermitido,
  type Plano,
  type Servico,
} from "@/lib/onboarding/tipos";

const DIAS_VALIDADE = 30;

type Criacao =
  | { ok: true; token: string }
  | { ok: false; mensagem: string };

export async function criarConvite(entrada: {
  nomeCliente: string;
  emailCliente: string;
  plano: string;
  servicos: string[];
}): Promise<Criacao> {
  const admin = await exigirAdmin();

  const nomeCliente = entrada.nomeCliente?.trim() ?? "";
  const emailCliente = entrada.emailCliente?.trim() ?? "";

  if (!nomeCliente || !emailCliente) {
    return { ok: false, mensagem: "Informe nome e e-mail do cliente." };
  }
  if (!ehPlano(entrada.plano)) {
    return { ok: false, mensagem: "Plano inválido." };
  }

  const plano: Plano = entrada.plano;
  const servicos = (entrada.servicos ?? []).filter(ehServico) as Servico[];

  if (servicos.length === 0) {
    return { ok: false, mensagem: "Marque pelo menos um serviço contratado." };
  }

  // A regra "sistema e Ads são só Premium" vale no servidor. O cliente não
  // escolhe o próprio escopo, então este é o único lugar onde ela é aplicada.
  const invalido = servicos.find((s) => !servicoPermitido(s, plano));
  if (invalido) {
    return { ok: false, mensagem: `O serviço "${invalido}" só existe no plano Premium.` };
  }

  const token = randomBytes(24).toString("base64url");

  await prisma.conviteOnboarding.create({
    data: {
      token,
      nomeCliente,
      emailCliente,
      plano,
      servicos,
      criadoPor: admin.email,
      expiraEm: new Date(Date.now() + DIAS_VALIDADE * 24 * 60 * 60 * 1000),
    },
  });

  revalidatePath("/admin/onboarding");
  return { ok: true, token };
}

export async function marcarLido(id: string, lido: boolean) {
  await exigirAdmin();
  await prisma.respostaOnboarding.update({ where: { id }, data: { lido } });
  revalidatePath("/admin/onboarding");
}

export async function excluirConvite(id: string) {
  await exigirAdmin();
  // A resposta cai junto por onDelete: Cascade.
  await prisma.conviteOnboarding.delete({ where: { id } });
  revalidatePath("/admin/onboarding");
}
