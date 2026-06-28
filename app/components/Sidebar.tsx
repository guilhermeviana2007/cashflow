"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sair } from "@/app/login/actions";
import { LogoHorizontal } from "@/app/components/LogoCashFlow";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/relatorios", label: "Relatórios", icon: "📈" },
  { href: "/lancamentos", label: "Lançamentos", icon: "💸" },
  { href: "/lancamentos/novo", label: "Novo lançamento", icon: "➕" },
  { href: "/estoque", label: "Estoque", icon: "📦" },
  { href: "/marketplaces", label: "Marketplaces", icon: "🛵" },
  { href: "/custos-fixos", label: "Custos Fixos", icon: "🔄" },
  { href: "/configuracoes", label: "Configurações", icon: "⚙️" },
  { href: "/minha-conta", label: "Minha conta", icon: "👤" },
  { href: "/suporte", label: "Suporte IA", icon: "💬" },
];

export function Sidebar({
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

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card p-4 hidden md:flex flex-col gap-1">
      <div className="px-2 py-3 mb-2">
        <LogoHorizontal />
      </div>

      {LINKS.map((link) => {
        const ativo = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            data-ativo={ativo || undefined}
            className={`pill flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
              ativo
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-background"
            }`}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        );
      })}

      {/* Link admin — só aparece para administradores */}
      {isAdmin && (
        <Link
          href="/admin"
          data-ativo={pathname.startsWith("/admin") || undefined}
          className={`pill flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium mt-2 border border-primary/20 ${
            pathname.startsWith("/admin")
              ? "bg-primary text-primary-foreground"
              : "text-primary hover:bg-primary/10"
          }`}
        >
          <span>🛡️</span>
          Administração
        </Link>
      )}

      {/* Usuário + sair (fixado no rodapé) */}
      <div className="mt-auto border-t border-border pt-3">
        <Link
          href="/minha-conta"
          className="flex items-center gap-2 px-2 mb-2 py-1.5 rounded-lg hover:bg-background"
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
            <span className="block truncate text-xs text-muted" title={email}>
              {email}
            </span>
          </span>
        </Link>
        <form action={sair}>
          <button
            type="submit"
            className="btn w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-muted hover:bg-background hover:text-danger"
          >
            ↩ Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
