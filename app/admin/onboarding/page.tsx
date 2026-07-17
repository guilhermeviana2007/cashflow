import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/auth";
import { formatData } from "@/lib/format";
import { PainelOnboarding, type ConviteView } from "./PainelOnboarding";
import type { Pendencia } from "@/lib/onboarding/tipos";

export default async function AdminOnboardingPage() {
  // Autorização na própria rota, junto da query — não delegada ao layout.
  await exigirAdmin();

  const convites = await prisma.conviteOnboarding.findMany({
    orderBy: { createdAt: "desc" },
    include: { resposta: true },
  });

  const agora = new Date();

  const dados: ConviteView[] = convites.map((c) => ({
    id: c.id,
    token: c.token,
    nomeCliente: c.nomeCliente,
    emailCliente: c.emailCliente,
    plano: c.plano,
    servicos: c.servicos,
    criadoEm: formatData(c.createdAt),
    expiraEm: formatData(c.expiraEm),
    expirado: c.expiraEm < agora,
    resposta: c.resposta
      ? {
          id: c.resposta.id,
          lido: c.resposta.lido,
          enviadoEm: formatData(c.resposta.createdAt),
          aceiteNome: c.resposta.aceiteNome,
          aceiteCargo: c.resposta.aceiteCargo,
          pendencias: c.resposta.pendencias as unknown as Pendencia[],
          respostas: c.resposta.respostas as Record<string, Record<string, unknown>>,
        }
      : null,
  }));

  const respondidos = dados.filter((d) => d.resposta);
  const naoLidos = respondidos.filter((d) => !d.resposta?.lido).length;
  const bloqueantes = respondidos.reduce(
    (n, d) => n + (d.resposta?.pendencias.filter((p) => p.criticidade === "bloqueante").length ?? 0),
    0
  );

  // O link do cliente aponta para o site do SEO Pro, não para o CashFlow.
  // Definido em ONBOARDING_BASE_URL; sem ele, cai no host atual como fallback.
  const h = await headers();
  const hostAtual = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host") ?? ""}`;
  const baseUrl = (process.env.ONBOARDING_BASE_URL ?? hostAtual).replace(/\/$/, "");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-bold">Onboarding</h1>
          <p className="text-sm text-muted">
            Links de onboarding e respostas dos clientes que já fecharam.
          </p>
        </div>
        <Link
          href="/admin"
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:bg-card"
        >
          ← Voltar
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-1 text-xs text-muted">Respondidos</div>
          <div className="text-xl font-bold">{respondidos.length}</div>
        </div>
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
          <div className="mb-1 text-xs text-muted">Novos</div>
          <div className="text-xl font-bold text-primary">{naoLidos}</div>
        </div>
        <div className="rounded-xl border border-danger/40 bg-danger/5 p-4">
          <div className="mb-1 text-xs text-muted">Pendências 🔴</div>
          <div className="text-xl font-bold text-danger">{bloqueantes}</div>
        </div>
      </div>

      <PainelOnboarding convites={dados} baseUrl={baseUrl} />
    </div>
  );
}
