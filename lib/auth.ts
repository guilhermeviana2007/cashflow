import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const COOKIE = "caixafood_sessao";
// Cookie de impersonação: guarda o id do usuário que um ADMIN está visualizando.
const COOKIE_VER_COMO = "caixafood_ver_como";
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

// Usuário REAL da sessão (quem fez login) — ignora impersonação.
export const getUsuarioReal = cache(async () => {
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

// Usuário EFETIVO — se um admin está "vendo como cliente", retorna o cliente.
// Todo o resto do app (estabelecimento, lançamentos…) passa a enxergar este.
export const getUsuarioAtual = cache(async () => {
  const real = await getUsuarioReal();
  if (!real) return null;
  if (!ehAdmin(real.email)) return real;

  const store = await cookies();
  const alvoId = store.get(COOKIE_VER_COMO)?.value;
  if (!alvoId) return real;

  const alvo = await prisma.usuario.findUnique({ where: { id: alvoId } });
  return alvo ?? real;
});

// Contexto completo da sessão — usado no layout para a barra de impersonação.
export const getSessaoInfo = cache(async () => {
  const real = await getUsuarioReal();
  const efetivo = await getUsuarioAtual();
  return {
    real,
    efetivo,
    impersonando: !!real && !!efetivo && real.id !== efetivo.id,
  };
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

// Exige que o usuário REAL seja admin (impersonação não rebaixa o acesso).
export async function exigirAdmin() {
  const usuario = await getUsuarioReal();
  if (!usuario || !ehAdmin(usuario.email)) redirect("/");
  return usuario;
}

// Inicia a visualização "como cliente". Só um admin real pode.
export async function iniciarVerComo(usuarioAlvoId: string) {
  const real = await getUsuarioReal();
  if (!real || !ehAdmin(real.email)) return;
  const store = await cookies();
  store.set(COOKIE_VER_COMO, usuarioAlvoId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function pararVerComo() {
  const store = await cookies();
  store.delete(COOKIE_VER_COMO);
}

export async function logout() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await prisma.sessao.deleteMany({ where: { id: token } });
    store.delete(COOKIE);
  }
  store.delete(COOKIE_VER_COMO);
}
