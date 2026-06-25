import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/app/components/Sidebar";
import { getUsuarioAtual, ehAdmin } from "@/lib/auth";

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
  const usuario = await getUsuarioAtual();

  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        {usuario ? (
          <div className="flex min-h-screen">
            <Sidebar email={usuario.email} isAdmin={ehAdmin(usuario.email)} />
            <main className="flex-1 p-6 lg:p-10 max-w-6xl mx-auto w-full">
              {children}
            </main>
          </div>
        ) : (
          // Telas públicas (login/cadastro) — sem moldura.
          children
        )}
      </body>
    </html>
  );
}
