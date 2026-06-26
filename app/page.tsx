import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { formatBRL, formatData } from "@/lib/format";
import { gerarCustosFixosDoMes } from "@/lib/custos-fixos";
import { calcularSaldoAtual } from "@/lib/saldo";
import {
  PERIODOS,
  resolverPeriodo,
  granularidadeDoPeriodo,
  chaveBucket,
  rotuloBucket,
} from "@/lib/periodo";
import { GraficoFluxo, type PontoFluxo } from "@/app/components/GraficoFluxo";
import {
  GraficoCategorias,
  type FatiaCategoria,
} from "@/app/components/GraficoCategorias";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo } = await searchParams;
  const { id: periodoId, dias, inicio, fim } = resolverPeriodo(periodo);
  const estab = await getEstabelecimentoAtual();

  // Dispara em background — não bloqueia o render do dashboard
  gerarCustosFixosDoMes(estab.id).catch(console.error);

  const [lancamentos, saldoAtual] = await Promise.all([
    prisma.lancamento.findMany({
      where: { estabelecimentoId: estab.id, data: { gte: inicio, lte: fim } },
      include: { categoria: true },
      orderBy: { data: "asc" },
    }),
    calcularSaldoAtual(estab),
  ]);

  // Totais do período (entradas já líquidas de taxa)
  const entradas = lancamentos
    .filter((l) => l.tipo === "ENTRADA")
    .reduce((s, l) => s + l.valorCentavos - l.taxaDescontadaCentavos, 0);
  const saidas = lancamentos
    .filter((l) => l.tipo === "SAIDA")
    .reduce((s, l) => s + l.valorCentavos, 0);
  const saldoPeriodo = entradas - saidas;

  // Série temporal (entradas líquidas vs saídas por balde)
  const gran = granularidadeDoPeriodo(dias);
  const baldes = new Map<string, { entradas: number; saidas: number }>();
  for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
    baldes.set(chaveBucket(new Date(d), gran), { entradas: 0, saidas: 0 });
  }
  for (const l of lancamentos) {
    const chave = chaveBucket(l.data, gran);
    const b = baldes.get(chave) ?? { entradas: 0, saidas: 0 };
    if (l.tipo === "ENTRADA") b.entradas += l.valorCentavos - l.taxaDescontadaCentavos;
    else b.saidas += l.valorCentavos;
    baldes.set(chave, b);
  }
  const serie: PontoFluxo[] = [...baldes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, v]) => ({
      rotulo: rotuloBucket(chave, gran),
      entradas: v.entradas / 100,
      saidas: v.saidas / 100,
    }));

  // Saídas por categoria
  const porCategoria = new Map<string, number>();
  for (const l of lancamentos) {
    if (l.tipo !== "SAIDA") continue;
    const nome = l.categoria?.nome ?? "Sem categoria";
    porCategoria.set(nome, (porCategoria.get(nome) ?? 0) + l.valorCentavos);
  }
  const categorias: FatiaCategoria[] = [...porCategoria.entries()]
    .map(([nome, v]) => ({ nome, valor: v / 100 }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted">{estab.nome}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PERIODOS.map((p) => {
            const ativo = p.id === periodoId;
            return (
              <Link
                key={p.id}
                href={`/?periodo=${p.id}`}
                data-ativo={ativo || undefined}
                className={`pill rounded-lg px-3 py-1.5 text-sm font-medium border ${
                  ativo
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card text-muted border-border hover:border-foreground"
                }`}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Saldo atual do caixa — destaque principal */}
      <div
        className={`rounded-xl border p-5 mb-4 flex items-center justify-between ${
          saldoAtual >= 0
            ? "border-primary/40 bg-primary/5"
            : "border-danger/40 bg-danger/5"
        }`}
      >
        <div>
          <div className="text-sm text-muted mb-1">Saldo atual do caixa</div>
          <div
            className={`text-3xl font-bold ${
              saldoAtual >= 0 ? "text-primary" : "text-danger"
            }`}
          >
            {formatBRL(saldoAtual)}
          </div>
          {estab.saldoInicialData ? (
            <div className="text-xs text-muted mt-1">
              Desde {formatData(estab.saldoInicialData)} · saldo inicial{" "}
              {formatBRL(estab.saldoInicialCentavos)}
            </div>
          ) : (
            <div className="text-xs text-muted mt-1">
              Todos os lançamentos ·{" "}
              <Link href="/configuracoes" className="underline hover:text-foreground">
                definir saldo inicial
              </Link>
            </div>
          )}
        </div>
        <Link
          href="/configuracoes"
          className="text-xs text-muted hover:text-foreground border border-border rounded-lg px-3 py-1.5"
        >
          Configurar
        </Link>
      </div>

      {/* Cards do período selecionado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card titulo="Entradas (líq.)" valor={formatBRL(entradas)} cor="text-primary" />
        <Card titulo="Saídas" valor={formatBRL(saidas)} cor="text-danger" />
        <Card
          titulo="Resultado do período"
          valor={formatBRL(saldoPeriodo)}
          cor={saldoPeriodo >= 0 ? "text-primary" : "text-danger"}
          destaque
        />
      </div>

      <Painel titulo="Fluxo de caixa">
        <GraficoFluxo dados={serie} />
      </Painel>

      <Painel titulo="Para onde vai o dinheiro (saídas por categoria)">
        <GraficoCategorias dados={categorias} />
      </Painel>

      {lancamentos.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted mt-2">
          Nenhum lançamento neste período.{" "}
          <Link href="/lancamentos/novo" className="text-primary underline">
            Registrar agora
          </Link>
        </div>
      )}
    </div>
  );
}

function Card({
  titulo,
  valor,
  cor,
  destaque,
}: {
  titulo: string;
  valor: string;
  cor: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        destaque ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="text-sm text-muted mb-1">{titulo}</div>
      <div className={`text-2xl font-bold ${cor}`}>{valor}</div>
    </div>
  );
}

function Painel({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 mb-6">
      <h2 className="font-semibold mb-4">{titulo}</h2>
      {children}
    </div>
  );
}
