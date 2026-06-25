"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { hashSenha, verificarSenha } from "@/lib/senha";
import { enviarEmail } from "@/lib/email";

export type EstadoConta = { ok?: boolean; erro?: string; msg?: string };

const SITE = process.env.SITE_URL || "https://caixafood.vercel.app";
const LIMITE_FOTO = 1_500_000; // ~1.1MB de imagem (base64)

export async function salvarPerfil(
  _prev: EstadoConta,
  formData: FormData
): Promise<EstadoConta> {
  const estab = await getEstabelecimentoAtual();
  const nome = String(formData.get("nome") || "").trim();
  if (!nome) return { erro: "Informe o nome do estabelecimento." };

  const foto = String(formData.get("fotoPerfil") || "");
  const fotoValida = foto && foto.length <= LIMITE_FOTO ? foto : foto === "" ? null : undefined;

  await prisma.estabelecimento.update({
    where: { id: estab.id },
    data: { nome, ...(fotoValida !== undefined ? { fotoPerfil: fotoValida } : {}) },
  });

  revalidatePath("/minha-conta");
  revalidatePath("/");
  return { ok: true, msg: "Perfil salvo." };
}

export async function alterarSenha(
  _prev: EstadoConta,
  formData: FormData
): Promise<EstadoConta> {
  const usuario = await exigirUsuario();
  const atual = String(formData.get("senhaAtual") || "");
  const nova = String(formData.get("novaSenha") || "");
  const conf = String(formData.get("confirmar") || "");

  if (!verificarSenha(atual, usuario.senhaHash)) {
    return { erro: "Senha atual incorreta." };
  }
  if (nova.length < 6) {
    return { erro: "A nova senha precisa ter pelo menos 6 caracteres." };
  }
  if (nova !== conf) {
    return { erro: "A confirmação não confere com a nova senha." };
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { senhaHash: hashSenha(nova) },
  });
  return { ok: true, msg: "Senha alterada com sucesso." };
}

export async function salvarContato(
  _prev: EstadoConta,
  formData: FormData
): Promise<EstadoConta> {
  const usuario = await exigirUsuario();
  const telefone = String(formData.get("telefone") || "").trim() || null;
  const emailRec =
    String(formData.get("emailRecuperacao") || "").trim().toLowerCase() || null;

  if (emailRec && !emailRec.includes("@")) {
    return { erro: "E-mail de recuperação inválido." };
  }

  const mudouEmail = emailRec !== usuario.emailRecuperacao;
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      telefone,
      emailRecuperacao: emailRec,
      ...(mudouEmail
        ? {
            emailRecuperacaoVerificado: false,
            tokenVerificacao: null,
            tokenVerificacaoExpira: null,
          }
        : {}),
    },
  });

  revalidatePath("/minha-conta");
  return { ok: true, msg: "Dados de segurança salvos." };
}

// Gera um token e envia o link de confirmação para o e-mail de recuperação.
export async function enviarVerificacao(
  _prev: EstadoConta,
  _formData: FormData
): Promise<EstadoConta> {
  const usuario = await exigirUsuario();
  if (!usuario.emailRecuperacao) {
    return { erro: "Cadastre e salve um e-mail de recuperação primeiro." };
  }
  if (usuario.emailRecuperacaoVerificado) {
    return { ok: true, msg: "Este e-mail já está verificado." };
  }

  const token = randomBytes(24).toString("hex");
  const expira = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { tokenVerificacao: token, tokenVerificacaoExpira: expira },
  });

  const link = `${SITE}/api/verificar-email?token=${token}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#15a06a">CashFlux</h2>
      <p>Confirme este e-mail como recuperação da sua conta. O link vale por 24 horas.</p>
      <p style="margin:24px 0">
        <a href="${link}" style="background:#15a06a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">
          Confirmar e-mail
        </a>
      </p>
      <p style="color:#666;font-size:13px">Se você não pediu isso, ignore este e-mail.</p>
    </div>`;

  try {
    await enviarEmail(usuario.emailRecuperacao, "Confirme seu e-mail — CashFlux", html);
    return { ok: true, msg: "Enviamos um link de confirmação para o seu e-mail." };
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (m === "EMAIL_NAO_CONFIGURADO") {
      return { erro: "O envio de e-mail ainda não está ativo. Fale com o suporte." };
    }
    return { erro: "Não consegui enviar o e-mail agora. Tente novamente em instantes." };
  }
}
