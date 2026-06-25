import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const COOKIE = "caixafood_sessao";
const DIAS = 30;

// Cria uma sessão no banco e grava o token no cookie do navegador.
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

// Retorna o usuário logado, ou null se não houver sessão válida.
export async function getUsuarioAtual() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  const sessao = await prisma.sessao.findUnique({
    where: { id: token },
    include: { usuario: true },
  });
  if (!sessao || sessao.expiraEm < new Date()) return null;
  return sessao.usuario;
}

// Garante que há um usuário logado; senão, redireciona para /login.
export async function exigirUsuario() {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  return usuario;
}

// Retorna true se o e-mail consta em ADMIN_EMAILS no .env.
export function ehAdmin(email: string): boolean {
  const lista = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(email.toLowerCase());
}

// Garante que o usuário logado é admin; senão, redireciona para /.
export async function exigirAdmin() {
  const usuario = await getUsuarioAtual();
  if (!usuario || !ehAdmin(usuario.email)) redirect("/");
  return usuario;
}

// Encerra a sessão atual (remove do banco e apaga o cookie).
export async function logout() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await prisma.sessao.deleteMany({ where: { id: token } });
    store.delete(COOKIE);
  }
}
