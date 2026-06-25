import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/app/components/Sidebar";
import { BottomNav } from "@/app/components/BottomNav";
import { BarraImpersonacao } from "@/app/components/BarraImpersonacao";
import { AvisoAssinatura } from "@/app/components/AvisoAssinatura";
import { ContaSuspensa } from "@/app/components/ContaSuspensa";
import { getSessaoInfo, ehAdmin } from "@/lib/auth";
import { garantirAssinatura, calcularSituacao, type Situacao } from "@/lib/assinatura";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cash Flow — Controle de caixa",
  description:
    "Centralize entradas e saídas do seu estabelecimento e acompanhe seus gráficos.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { real, efetivo, impersonando } = await getSessaoInfo();
  const htmlProps = `${geistSans.variable} h-full antialiased`;

  // Não logado (login/cadastro) — sem moldura.
  if (!efetivo) {
    return (
      <html lang="pt-BR" className={htmlProps}>
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

  // Bloqueio total — só quando o próprio cliente está logado (não em impersonação).
  if (!impersonando && (situacao === "PAUSADA" || situacao === "CANCELADA")) {
    return (
      <html lang="pt-BR" className={htmlProps}>
        <body className="min-h-full">
          <ContaSuspensa email={efetivo.email} cancelada={situacao === "CANCELADA"} />
        </body>
      </html>
    );
  }

  return (
    <html lang="pt-BR" className={htmlProps}>
      <body className="min-h-full">
        {impersonando && <BarraImpersonacao email={efetivo.email} />}
        <div className="flex min-h-screen">
          <Sidebar email={efetivo.email} isAdmin={ehAdmin(efetivo.email)} />
          <main className="flex-1 p-4 md:p-6 lg:p-10 max-w-6xl mx-auto w-full pb-24 md:pb-10">
            {(situacao === "PROXIMA" || situacao === "VENCIDA") && proximoVencimento && (
              <AvisoAssinatura
                situacao={situacao}
                dias={dias}
                proximoVencimento={proximoVencimento}
              />
            )}
            {impersonando && (situacao === "PAUSADA" || situacao === "CANCELADA") && (
              <div className="mb-5 rounded-xl border-2 border-danger bg-danger/10 p-4 text-sm font-semibold text-danger">
                🔒 Esta conta está {situacao === "CANCELADA" ? "cancelada" : "pausada"} — o
                cliente não consegue acessar o sistema.
              </div>
            )}
            {children}
          </main>
          <BottomNav email={efetivo.email} isAdmin={ehAdmin(efetivo.email)} />
        </div>
      </body>
    </html>
  );
}
