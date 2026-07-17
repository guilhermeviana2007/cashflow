import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { formatBRL, formatData } from "@/lib/format";
import { calcularSaldoAtual } from "@/lib/saldo";
import { TabelaLancamentos } from "./TabelaLancamentos";

export default async function LancamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const estab = await getEstabelecimentoAtual();

  const where = {
    estabelecimentoId: estab.id,
    ...(tipo === "ENTRADA" || tipo === "SAIDA" ? { tipo } : {}),
  };

  const [lancamentos, saldoAtual] = await Promise.all([
    prisma.lancamento.findMany({
      where,
      orderBy: { data: "desc" },
      include: { categoria: true },
      take: 200,
    }),
    calcularSaldoAtual(estab),
  ]);

  // Usa valores líquidos de taxa para entradas
  const entradas = lancamentos
    .filter((l) => l.tipo === "ENTRADA")
    .reduce((s, l) => s + l.valorCentavos - l.taxaDescontadaCentavos, 0);
  const saidas = lancamentos
    .filter((l) => l.tipo === "SAIDA")
    .reduce((s, l) => s + l.valorCentavos, 0);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Lançamentos</h1>
          <p className="text-sm text-muted">Histórico de entradas e saídas.</p>
        </div>
        <Link
          href="/lancamentos/novo"
          className="btn shrink-0 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90"
        >
          + Novo
        </Link>
      </div>

      {/* Saldo atual do caixa */}
      <div
        className={`rounded-xl border p-4 mb-4 flex items-center justify-between gap-3 ${
          saldoAtual >= 0
            ? "border-primary/30 bg-primary/5"
            : "border-danger/30 bg-danger/5"
        }`}
      >
        <div className="min-w-0">
          <div className="text-xs text-muted mb-0.5">Saldo atual do caixa</div>
          <div
            className={`text-2xl font-bold tabular-nums break-words ${
              saldoAtual >= 0 ? "text-primary" : "text-danger"
            }`}
          >
            {formatBRL(saldoAtual)}
          </div>
        </div>
        {estab.saldoInicialData && (
          <div className="shrink-0 text-xs text-muted text-right">
            desde {formatData(estab.saldoInicialData)}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        <FiltroLink atual={tipo} valor={undefined} label="Todos" />
        <FiltroLink atual={tipo} valor="ENTRADA" label="Entradas" />
        <FiltroLink atual={tipo} valor="SAIDA" label="Saídas" />
      </div>

      {/* Resumo do filtro atual */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
        <Resumo titulo="Entradas líq." valor={entradas} cor="text-primary" />
        <Resumo titulo="Saídas" valor={saidas} cor="text-danger" />
        <Resumo titulo="Resultado" valor={entradas - saidas} cor="text-foreground" />
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <TabelaLancamentos
          lancamentos={lancamentos.map((l) => ({
            id: l.id,
            tipo: l.tipo as "ENTRADA" | "SAIDA",
            descricao: l.descricao,
            fornecedor: l.fornecedor,
            valorCentavos: l.valorCentavos,
            taxaDescontadaCentavos: l.taxaDescontadaCentavos,
            dataFormatada: formatData(l.data),
            categoriaNome: l.categoria?.nome ?? null,
            origem: l.origem,
          }))}
        />
      </div>
    </div>
  );
}

function FiltroLink({
  atual,
  valor,
  label,
}: {
  atual?: string;
  valor?: string;
  label: string;
}) {
  const ativo = atual === valor || (!atual && !valor);
  const href = valor ? `/lancamentos?tipo=${valor}` : "/lancamentos";
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-sm font-medium border ${
        ativo
          ? "bg-foreground text-background border-foreground"
          : "bg-card text-muted border-border hover:border-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

function Resumo({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: number;
  cor: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 min-w-0">
      <div className="text-[11px] sm:text-xs text-muted mb-1 leading-tight truncate">
        {titulo}
      </div>
      <div
        className={`text-base sm:text-xl font-bold leading-tight tabular-nums break-words ${cor}`}
      >
        {formatBRL(valor)}
      </div>
    </div>
  );
}
