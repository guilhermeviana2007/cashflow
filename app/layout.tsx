import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/app/components/Sidebar";
import { BottomNav } from "@/app/components/BottomNav";
import { BarraImpersonacao } from "@/app/components/BarraImpersonacao";
import { AvisoAssinatura } from "@/app/components/AvisoAssinatura";
import { ContaSuspensa } from "@/app/components/ContaSuspensa";
import { getSessaoInfo, ehAdmin } from "@/lib/auth";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { garantirAssinatura, calcularSituacao, type Situacao } from "@/lib/assinatura";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cash Flow — Fluxo de Caixa",
  description:
    "Centralize entradas e saídas do seu estabelecimento e acompanhe seus gráficos.",
  icons: { icon: "/favicon.svg" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { real, efetivo, impersonando } = await getSessaoInfo();
  const htmlProps = `${geistSans.variable} h-full antialiased`;
  const tema =
    (await cookies()).get("caixafood_tema")?.value === "claro" ? "claro" : undefined;

  // Não logado (login/cadastro) — sem moldura.
  if (!efetivo) {
    return (
      <html lang="pt-BR" data-tema={tema} className={htmlProps}>
        <body className="min-h-full">{children}</body>
      </html>
    );
  }

  // Admin vendo a própria conta nunca recebe aviso/bloqueio de cobrança.
  const adminProprio = !!real && ehAdmin(real.email) && !impersonando;

  let situacao: Situacao | null = null;
  let dias = 0;
  let proximoVencimento: Date | null = null;
  if (!adminProprio) {
    const assinatura = await garantirAssinatura(efetivo.id);
    const s = calcularSituacao(assinatura);
    situacao = s.situacao;
    dias = s.dias;
    proximoVencimento = assinatura.proximoVencimento;
  }

  // Bloqueio total — conta aguardando liberação, vencida, pausada ou cancelada (só para o próprio cliente, não admin).
  if (!impersonando && (situacao === "PENDENTE" || situacao === "VENCIDA" || situacao === "PAUSADA" || situacao === "CANCELADA")) {
    return (
      <html lang="pt-BR" data-tema={tema} className={htmlProps}>
        <body className="min-h-full">
          <ContaSuspensa email={efetivo.email} situacao={situacao} />
        </body>
      </html>
    );
  }

  const estab = await getEstabelecimentoAtual();

  return (
    <html lang="pt-BR" data-tema={tema} className={htmlProps}>
      <body className="min-h-full">
        {impersonando && <BarraImpersonacao email={efetivo.email} />}
        <div className="flex min-h-screen">
          <Sidebar
            email={efetivo.email}
            isAdmin={ehAdmin(efetivo.email)}
            nome={estab.nome}
            fotoPerfil={estab.fotoPerfil}
          />
          <main className="flex-1 p-4 md:p-6 lg:p-10 max-w-6xl mx-auto w-full pb-24 md:pb-10">
            {situacao === "PROXIMA" && proximoVencimento && (
              <AvisoAssinatura
                situacao={situacao}
                dias={dias}
                proximoVencimento={proximoVencimento}
              />
            )}
            {impersonando && (situacao === "PENDENTE" || situacao === "VENCIDA" || situacao === "PAUSADA" || situacao === "CANCELADA") && (
              <div className="mb-5 rounded-xl border-2 border-danger bg-danger/10 p-4 text-sm font-semibold text-danger">
                🔒 Esta conta está{" "}
                {situacao === "CANCELADA"
                  ? "cancelada"
                  : situacao === "PAUSADA"
                    ? "pausada"
                    : situacao === "PENDENTE"
                      ? "aguardando liberação"
                      : "com mensalidade vencida"}{" "}
                — o cliente não consegue acessar o sistema.
              </div>
            )}
            {children}
          </main>
          <BottomNav
            email={efetivo.email}
            isAdmin={ehAdmin(efetivo.email)}
            nome={estab.nome}
            fotoPerfil={estab.fotoPerfil}
          />
        </div>
      </body>
    </html>
  );
}
