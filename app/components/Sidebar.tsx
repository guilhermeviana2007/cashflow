"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sair } from "@/app/login/actions";

const LINKS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/relatorios", label: "Relatórios", icon: "📈" },
  { href: "/lancamentos", label: "Lançamentos", icon: "💸" },
  { href: "/lancamentos/novo", label: "Novo lançamento", icon: "➕" },
  { href: "/lancamentos/importar", label: "Importar nota (IA)", icon: "🤖" },
  { href: "/custos-fixos", label: "Custos Fixos", icon: "🔄" },
  { href: "/configuracoes", label: "Configurações", icon: "⚙️" },
  { href: "/suporte", label: "Suporte IA", icon: "💬" },
];

export function Sidebar({ email, isAdmin }: { email: string; isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card p-4 hidden md:flex flex-col gap-1">
      <div className="px-2 py-3 mb-2">
        <div className="text-xl font-bold text-primary">Cash Flow</div>
        <div className="text-xs text-muted">Controle de caixa</div>
      </div>

      {LINKS.map((link) => {
        const ativo = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors mt-2 border border-primary/20 ${
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
        <div className="px-2 mb-2 truncate text-xs text-muted" title={email}>
          {email}
        </div>
        <form action={sair}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-muted hover:bg-background hover:text-danger"
          >
            ↩ Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
