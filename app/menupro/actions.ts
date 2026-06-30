"use server";

import { prisma } from "@/lib/prisma";

export type ResultadoEnvio =
  | { ok: true }
  | { ok: false; mensagem: string };

function txt(fd: FormData, campo: string): string {
  return String(fd.get(campo) ?? "").trim();
}

export async function enviarFormularioMenuPro(fd: FormData): Promise<ResultadoEnvio> {
  const nomeResponsavel = txt(fd, "nomeResponsavel");
  const telefone = txt(fd, "telefone");
  const email = txt(fd, "email");
  const cnpj = txt(fd, "cnpj");
  const nomeEstabelecimento = txt(fd, "nomeEstabelecimento");

  // Campos obrigatórios mínimos
  if (!nomeResponsavel || !telefone || !email || !nomeEstabelecimento) {
    return {
      ok: false,
      mensagem: "Preencha pelo menos nome, telefone, e-mail e nome do estabelecimento.",
    };
  }

  try {
    await prisma.formularioMenuPro.create({
      data: {
        nomeResponsavel,
        telefone,
        email,
        cnpj,
        nomeEstabelecimento,
        marketplaces: txt(fd, "marketplaces"),
        trabalhaMesas: txt(fd, "trabalhaMesas") || "Não informado",
        entregaPropria: txt(fd, "entregaPropria") || "Não informado",
        cardapioLogin: txt(fd, "cardapioLogin") || null,
        cardapioSenha: txt(fd, "cardapioSenha") || null,
        ifoodLogin: txt(fd, "ifoodLogin") || null,
        ifoodSenha: txt(fd, "ifoodSenha") || null,
        noveNoveLogin: txt(fd, "noveNoveLogin") || null,
        noveNoveSenha: txt(fd, "noveNoveSenha") || null,
        sistemaFinanceiro: txt(fd, "sistemaFinanceiro") || null,
        canaisAtendimento: txt(fd, "canaisAtendimento") || null,
        temFotos: txt(fd, "temFotos") || "Não informado",
      },
    });
    return { ok: true };
  } catch (e) {
    console.error("Erro ao salvar formulário MenuPro:", e);
    return { ok: false, mensagem: "Erro ao enviar. Tente novamente em instantes." };
  }
}
