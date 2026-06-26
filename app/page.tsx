import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth";
import { LogoVertical } from "@/app/components/LogoCashFlow";

export default async function LandingPage() {
  if (await getUsuarioAtual()) redirect("/dashboard");

  const recursos = [
    {
      icone: "💸",
      titulo: "Lançamentos rápidos",
      descricao: "Registre entradas e saídas em segundos, com categorias e formas de pagamento.",
    },
    {
      icone: "📊",
      titulo: "Gráficos em tempo real",
      descricao: "Visualize o fluxo do seu caixa por dia, semana ou mês com gráficos claros.",
    },
    {
      icone: "📦",
      titulo: "Controle de estoque",
      descricao: "Acompanhe seus produtos e seja avisado quando o estoque estiver baixo.",
    },
    {
      icone: "🔄",
      titulo: "Custos fixos",
      descricao: "Cadastre despesas recorrentes e elas entram automaticamente todo mês.",
    },
    {
      icone: "💬",
      titulo: "Suporte com IA",
      descricao: "Tire dúvidas sobre seu negócio com um assistente inteligente integrado.",
    },
    {
      icone: "📈",
      titulo: "Relatórios detalhados",
      descricao: "Relatórios por categoria, período e forma de pagamento para decisões mais certeiras.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-8">
          <LogoVertical />
        </div>

        <p className="text-2xl md:text-3xl font-semibold text-primary mb-2">
          Consciência é lucro.
        </p>
        <p className="text-muted text-base md:text-lg max-w-md mb-10">
          A ferramenta mais simples para controlar as finanças do seu estabelecimento — entradas, saídas, estoque e muito mais.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
          <Link
            href="/cadastro"
            className="btn rounded-xl bg-primary px-8 py-3.5 font-semibold text-primary-foreground text-base hover:opacity-90"
          >
            Criar conta grátis
          </Link>
          <Link
            href="/login"
            className="btn rounded-xl border border-border px-8 py-3.5 font-semibold text-foreground text-base hover:border-primary"
          >
            Entrar
          </Link>
        </div>

      </main>

      {/* Recursos */}
      <section className="px-6 pb-16 max-w-4xl mx-auto w-full">
        <h2 className="text-center text-lg font-semibold text-muted mb-8 uppercase tracking-widest text-sm">
          Tudo que você precisa
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {recursos.map((r) => (
            <div
              key={r.titulo}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="text-2xl mb-3">{r.icone}</div>
              <div className="font-semibold mb-1">{r.titulo}</div>
              <div className="text-sm text-muted">{r.descricao}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} Cash Flow · Consciência é lucro.
      </footer>
    </div>
  );
}
