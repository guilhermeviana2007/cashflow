"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { sair } from "@/app/login/actions";

const MENU_LINKS = [
  { href: "/estoque", label: "Estoque", icon: "📦" },
  { href: "/marketplaces", label: "Marketplaces", icon: "🛵" },
  { href: "/custos-fixos", label: "Custos Fixos", icon: "🔄" },
  { href: "/configuracoes", label: "Configurações", icon: "⚙️" },
  { href: "/minha-conta", label: "Minha conta", icon: "👤" },
  { href: "/suporte", label: "Suporte IA", icon: "💬" },
];

export function BottomNav({
  email,
  isAdmin,
  nome,
  fotoPerfil,
}: {
  email: string;
  isAdmin: boolean;
  nome: string;
  fotoPerfil: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const ativo = (href: string) => pathname === href;

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer deslizante */}
      {open && (
        <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border rounded-t-2xl z-50 md:hidden shadow-2xl">
          <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-4" />
          <div className="px-4 pb-4 flex flex-col gap-1">
            {MENU_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium hover:bg-background active:bg-background"
              >
                <span className="text-base">{link.icon}</span>
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-primary hover:bg-primary/10"
              >
                <span className="text-base">🛡️</span>
                Administração
              </Link>
            )}
            <div className="border-t border-border mt-2 pt-2">
              <Link
                href="/minha-conta"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-background"
              >
                <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border bg-background flex items-center justify-center">
                  {fotoPerfil ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fotoPerfil} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-muted">
                      {(nome || email).charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{nome}</span>
                  <span className="block truncate text-xs text-muted">{email}</span>
                </span>
              </Link>
              <form action={sair}>
                <button
                  type="submit"
                  className="btn w-full text-left px-3 py-3 text-sm font-medium text-muted hover:text-danger rounded-xl hover:bg-background"
                >
                  ↩ Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Barra inferior */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-stretch md:hidden z-40">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          data-ativo={ativo("/dashboard") || undefined}
          className={`pill flex-1 flex flex-col items-center justify-center gap-0.5 text-xs ${ativo("/dashboard") ? "text-primary" : "text-muted"}`}
        >
          <span className="text-xl leading-none">⊟</span>
          Início
        </Link>

        {/* Lançamentos */}
        <Link
          href="/lancamentos"
          data-ativo={ativo("/lancamentos") || undefined}
          className={`pill flex-1 flex flex-col items-center justify-center gap-0.5 text-xs ${ativo("/lancamentos") ? "text-primary" : "text-muted"}`}
        >
          <span className="text-xl leading-none">↕</span>
          Lançamentos
        </Link>

        {/* Botão + central em destaque */}
        <Link
          href="/lancamentos/novo"
          className="flex-1 flex flex-col items-center justify-center gap-0.5"
        >
          <div className="btn w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold -mt-5 shadow-lg shadow-primary/30">
            +
          </div>
          <span className="text-xs text-muted mt-0.5">Novo</span>
        </Link>

        {/* Relatórios */}
        <Link
          href="/relatorios"
          data-ativo={ativo("/relatorios") || undefined}
          className={`pill flex-1 flex flex-col items-center justify-center gap-0.5 text-xs ${ativo("/relatorios") ? "text-primary" : "text-muted"}`}
        >
          <span className="text-xl leading-none">↗</span>
          Relatórios
        </Link>

        {/* Menu */}
        <button
          onClick={() => setOpen(!open)}
          data-ativo={open || undefined}
          className={`pill flex-1 flex flex-col items-center justify-center gap-0.5 text-xs ${open ? "text-primary" : "text-muted"}`}
        >
          <span className="text-xl leading-none">≡</span>
          Menu
        </button>
      </nav>
    </>
  );
}
