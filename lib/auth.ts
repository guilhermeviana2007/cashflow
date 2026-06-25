import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const COOKIE = "caixafood_sessao";
const DIAS = 30;

export async function criarSessao(usuarioId: string) {
  const token = randomBytes(32).toString("hex");
  const expiraEm = new Date(Date.now() + DIAS * 24 * 60 * 60 * 1000);
  await prisma.sessao.create({ data: { id: token, usuarioId, expiraEm } });

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiraEm,
  });
}

// cache() deduplica chamadas dentro do mesmo request — se layout e page
// chamarem getUsuarioAtual(), o banco é consultado apenas uma vez.
export const getUsuarioAtual = cache(async () => {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  const sessao = await prisma.sessao.findUnique({
    where: { id: token },
    include: { usuario: true },
  });
  if (!sessao || sessao.expiraEm < new Date()) return null;
  return sessao.usuario;
});

export async function exigirUsuario() {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  return usuario;
}

export function ehAdmin(email: string): boolean {
  const lista = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(email.toLowerCase());
}

export async function exigirAdmin() {
  const usuario = await getUsuarioAtual();
  if (!usuario || !ehAdmin(usuario.email)) redirect("/");
  return usuario;
}

export async function logout() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await prisma.sessao.deleteMany({ where: { id: token } });
    store.delete(COOKIE);
  }
}
