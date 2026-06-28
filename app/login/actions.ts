"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashSenha, verificarSenha } from "@/lib/senha";
import { criarSessao, logout, pararVerComo } from "@/lib/auth";
import { criarEstabelecimentoComCategorias } from "@/lib/plano-de-contas";
import { criarAssinaturaPendente } from "@/lib/assinatura";

export type EstadoAuth = { erro?: string };

export async function entrar(
  _prev: EstadoAuth,
  formData: FormData
): Promise<EstadoAuth> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const senha = String(formData.get("senha") || "");

  if (!email || !senha) {
    return { erro: "Preencha email e senha." };
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !verificarSenha(senha, usuario.senhaHash)) {
    return { erro: "Email ou senha incorretos." };
  }

  await criarSessao(usuario.id);
  redirect("/dashboard");
}

export async function cadastrar(
  _prev: EstadoAuth,
  formData: FormData
): Promise<EstadoAuth> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const senha = String(formData.get("senha") || "");
  const confirmar = String(formData.get("confirmar") || "");
  const nome = String(formData.get("nome") || "").trim();
  const tipo = String(formData.get("tipo") || "outro");

  if (!email || !senha || !nome) {
    return { erro: "Preencha todos os campos obrigatórios." };
  }
  if (!email.includes("@")) {
    return { erro: "Informe um email válido." };
  }
  if (senha.length < 6) {
    return { erro: "A senha precisa ter pelo menos 6 caracteres." };
  }
  if (senha !== confirmar) {
    return { erro: "As senhas não conferem." };
  }

  const jaExiste = await prisma.usuario.findUnique({ where: { email } });
  if (jaExiste) {
    return { erro: "Já existe uma conta com esse email." };
  }

  const usuario = await prisma.usuario.create({
    data: { email, senhaHash: hashSenha(senha) },
  });
  await criarEstabelecimentoComCategorias(prisma, usuario.id, nome, tipo);
  await criarAssinaturaPendente(usuario.id); // conta nasce bloqueada até o admin confirmar o pagamento

  await criarSessao(usuario.id);
  redirect("/dashboard");
}

export async function sair() {
  await logout();
  redirect("/login");
}

// Encerra a visualização "como cliente" e volta ao painel admin.
export async function sairVisualizacao() {
  await pararVerComo();
  redirect("/admin");
}
