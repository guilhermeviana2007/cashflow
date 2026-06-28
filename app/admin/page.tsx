import { prisma } from "@/lib/prisma";
import { formatBRL, formatData } from "@/lib/format";
import { ehAdmin } from "@/lib/auth";
import {
  calcularSituacao,
  rotuloPlano,
  mesesDoPlano,
  adicionarMeses,
  type Situacao,
} from "@/lib/assinatura";
import { AcoesCliente } from "./AcoesCliente";

const INCLUDE = {
  estabelecimentos: {
    include: { _count: { select: { lancamentos: true } } },
  },
  assinatura: {
    include: { pagamentos: { orderBy: { dataPagamento: "desc" as const }, take: 1 } },
  },
} as const;

// Peso para ordenar: pendentes de liberação e problemas primeiro.
const PESO: Record<Situacao, number> = {
  PENDENTE: 0,
  VENCIDA: 1,
  PAUSADA: 2,
  CANCELADA: 2,
  PROXIMA: 3,
  EM_DIA: 4,
};

export default async function AdminPage() {
  let usuarios = await prisma.usuario.findMany({
    orderBy: { createdAt: "desc" },
    include: INCLUDE,
  });

  // Backfill: garante assinatura para contas antigas (criadas antes do billing).
  const semAssinatura = usuarios.filter((u) => !u.assinatura);
  if (semAssinatura.length > 0) {
    await prisma.assinatura.createMany({
      data: semAssinatura.map((u) => ({
        usuarioId: u.id,
        proximoVencimento: adicionarMeses(new Date(), 1),
      })),
      skipDuplicates: true,
    });
    usuarios = await prisma.usuario.findMany({
      orderBy: { createdAt: "desc" },
      include: INCLUDE,
    });
  }

  // Enriquecer com situação calculada.
  const linhas = usuarios
    .map((u) => {
      const a = u.assinatura!;
      const { situacao, dias } = calcularSituacao(a);
      return { u, a, situacao, dias };
    })
    .sort((x, y) => PESO[x.situacao] - PESO[y.situacao]);

  // Estatísticas de billing.
  const mrrCentavos = linhas
    .filter((l) => l.a.status === "ATIVA")
    .reduce((s, l) => s + Math.round(l.a.valorCentavos / mesesDoPlano(l.a.plano)), 0);
  const vencidos = linhas.filter((l) => l.situacao === "VENCIDA").length;
  const proximos = linhas.filter((l) => l.situacao === "PROXIMA").length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Administração</h1>
      <p className="text-muted mb-6">Assinaturas, acessos e pagamentos dos clientes.</p>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard titulo="Clientes" valor={usuarios.length.toString()} />
        <StatCard
          titulo="Receita mensal (MRR)"
          valor={formatBRL(mrrCentavos)}
          destaque
        />
        <StatCard titulo="Pagamentos vencidos" valor={vencidos.toString()} alerta={vencidos > 0} />
        <StatCard titulo="Próximos do vencimento" valor={proximos.toString()} />
      </div>

      {/* Lista de clientes (cards — funciona bem no celular) */}
      <div className="space-y-3">
        {linhas.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted">
            Nenhum cliente cadastrado ainda.
          </div>
        )}

        {linhas.map(({ u, a, situacao, dias }) => {
          const estab = u.estabelecimentos[0];
          const outros = u.estabelecimentos.length - 1;
          const lancamentos = u.estabelecimentos.reduce(
            (s, e) => s + e._count.lancamentos,
            0
          );
          const ultimoPagamento = a.pagamentos[0]?.dataPagamento ?? null;
          const valorReais = (a.valorCentavos / 100).toFixed(2).replace(".", ",");
          const admin = ehAdmin(u.email);

          return (
            <div key={u.id} className="rounded-xl border border-border bg-card p-4">
              {/* Cabeçalho */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {estab ? estab.nome : "— sem estabelecimento —"}
                    {outros > 0 && (
                      <span className="text-muted font-normal"> +{outros}</span>
                    )}
                    {admin && (
                      <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-xs text-primary align-middle">
                        admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted truncate">{u.email}</div>
                </div>
                <BadgeSituacao situacao={situacao} dias={dias} />
              </div>

              {/* Infos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                <Info titulo="Vencimento" valor={formatData(a.proximoVencimento)} />
                <Info
                  titulo="Mensalidade"
                  valor={`${formatBRL(a.valorCentavos)} · ${rotuloPlano(a.plano)}`}
                />
                <Info titulo="Lançamentos" valor={lancamentos.toLocaleString("pt-BR")} />
                <Info
                  titulo="Último pagto."
                  valor={ultimoPagamento ? formatData(ultimoPagamento) : "—"}
                />
              </div>

              {/* Ações */}
              <AcoesCliente
                usuarioId={u.id}
                email={u.email}
                assinaturaId={a.id}
                status={a.status}
                valorReais={valorReais}
                plano={a.plano}
                vencimentoISO={a.proximoVencimento.toISOString().slice(0, 10)}
                podeGerenciar={!admin}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BadgeSituacao({ situacao, dias }: { situacao: Situacao; dias: number }) {
  const mapa: Record<Situacao, { txt: string; cls: string }> = {
    PENDENTE: { txt: "Aguardando liberação", cls: "bg-indigo-500/15 text-indigo-400" },
    EM_DIA: { txt: "Em dia", cls: "bg-primary/15 text-primary" },
    PROXIMA: {
      txt: dias === 0 ? "Vence hoje" : `Vence em ${dias}d`,
      cls: "bg-amber-500/15 text-amber-500",
    },
    VENCIDA: {
      txt: `Vencida há ${Math.abs(dias)}d`,
      cls: "bg-danger/15 text-danger",
    },
    PAUSADA: { txt: "Pausada", cls: "bg-danger/15 text-danger" },
    CANCELADA: { txt: "Cancelada", cls: "bg-muted/20 text-muted" },
  };
  const { txt, cls } = mapa[situacao];
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {txt}
    </span>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{titulo}</div>
      <div className="font-medium">{valor}</div>
    </div>
  );
}

function StatCard({
  titulo,
  valor,
  destaque,
  alerta,
}: {
  titulo: string;
  valor: string;
  destaque?: boolean;
  alerta?: boolean;
}) {
  const cor = alerta
    ? "border-danger/40 bg-danger/5"
    : destaque
      ? "border-primary/40 bg-primary/5"
      : "border-border bg-card";
  const corValor = alerta ? "text-danger" : destaque ? "text-primary" : "text-foreground";
  return (
    <div className={`rounded-xl border p-5 ${cor}`}>
      <div className="text-xs text-muted mb-1">{titulo}</div>
      <div className={`text-xl font-bold ${corValor}`}>{valor}</div>
    </div>
  );
}
