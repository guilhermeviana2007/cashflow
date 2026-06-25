import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { formatBRL, formatData } from "@/lib/format";
import { gerarCustosFixosDoMes } from "@/lib/custos-fixos";
import {
  granularidadeDoPeriodo,
  chaveBucket,
  rotuloBucket,
} from "@/lib/periodo";
import { GraficoFluxo, type PontoFluxo } from "@/app/components/GraficoFluxo";
import { GraficoFormas, type FatiaForma } from "@/app/components/GraficoFormas";
import {
  GraficoCategorias,
  type FatiaCategoria,
} from "@/app/components/GraficoCategorias";
import { SeletorPeriodo } from "./SeletorPeriodo";

const PRESET_IDS = ["este-mes", "mes-passado", "7d", "14d", "3m"];

function inicioDia(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function fimDia(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function resolverPeriodo(p?: string, de?: string, ate?: string) {
  const hoje = new Date();

  if (de && ate) {
    return {
      id: "custom",
      label: "Período personalizado",
      inicio: inicioDia(new Date(de + "T00:00:00")),
      fim: fimDia(new Date(ate + "T00:00:00")),
    };
  }

  const id = PRESET_IDS.includes(p ?? "") ? (p as string) : "este-mes";

  if (id === "mes-passado") {
    const ini = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const f = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    return { id, label: "Mês passado", inicio: inicioDia(ini), fim: fimDia(f) };
  }

  const fim = fimDia(hoje);
  if (id === "7d") {
    return {
      id,
      label: "Últimos 7 dias",
      inicio: inicioDia(new Date(hoje.getTime() - 6 * 86_400_000)),
      fim,
    };
  }
  if (id === "14d") {
    return {
      id,
      label: "Últimos 14 dias",
      inicio: inicioDia(new Date(hoje.getTime() - 13 * 86_400_000)),
      fim,
    };
  }
  if (id === "3m") {
    const ini = new Date(hoje);
    ini.setMonth(ini.getMonth() - 3);
    return { id, label: "Últimos 3 meses", inicio: inicioDia(ini), fim };
  }
  // este-mes
  return {
    id: "este-mes",
    label: "Este mês",
    inicio: inicioDia(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
    fim,
  };
}

// Data local em YYYY-MM-DD (evita o deslocamento de fuso do toISOString).
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; de?: string; ate?: string }>;
}) {
  const { p, de, ate } = await searchParams;
  const estab = await getEstabelecimentoAtual();
  gerarCustosFixosDoMes(estab.id).catch(console.error);

  const periodo = resolverPeriodo(p, de, ate);

  const [lancamentos, formas] = await Promise.all([
    prisma.lancamento.findMany({
      where: {
        estabelecimentoId: estab.id,
        data: { gte: periodo.inicio, lte: periodo.fim },
      },
      include: { categoria: true },
      orderBy: { data: "desc" },
    }),
    prisma.formaPagamento.findMany({
      where: { estabelecimentoId: estab.id },
      select: { slug: true, nome: true },
    }),
  ]);

  const nomeForma = new Map(formas.map((f) => [f.slug, f.nome]));

  // Totais (entradas já líquidas pela taxa registrada no lançamento).
  const entradasLiq = lancamentos
    .filter((l) => l.tipo === "ENTRADA")
    .reduce((s, l) => s + l.valorCentavos - l.taxaDescontadaCentavos, 0);
  const saidas = lancamentos
    .filter((l) => l.tipo === "SAIDA")
    .reduce((s, l) => s + l.valorCentavos, 0);
  const resultado = entradasLiq - saidas;

  // Série temporal (fluxo de caixa).
  const dias = Math.round((periodo.fim.getTime() - periodo.inicio.getTime()) / 86_400_000) + 1;
  const gran = granularidadeDoPeriodo(dias);
  const baldes = new Map<string, { entradas: number; saidas: number }>();
  for (let d = new Date(periodo.inicio); d <= periodo.fim; d.setDate(d.getDate() + 1)) {
    baldes.set(chaveBucket(new Date(d), gran), { entradas: 0, saidas: 0 });
  }
  for (const l of lancamentos) {
    const b = baldes.get(chaveBucket(l.data, gran)) ?? { entradas: 0, saidas: 0 };
    if (l.tipo === "ENTRADA") b.entradas += l.valorCentavos - l.taxaDescontadaCentavos;
    else b.saidas += l.valorCentavos;
    baldes.set(chaveBucket(l.data, gran), b);
  }
  const serie: PontoFluxo[] = [...baldes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, v]) => ({
      rotulo: rotuloBucket(chave, gran),
      entradas: v.entradas / 100,
      saidas: v.saidas / 100,
    }));

  // Entradas líquidas por forma de pagamento (donut).
  const porForma = new Map<string, number>();
  for (const l of lancamentos) {
    if (l.tipo !== "ENTRADA") continue;
    const nome = l.formaPagamento
      ? nomeForma.get(l.formaPagamento) ?? l.formaPagamento
      : "Não informado";
    porForma.set(nome, (porForma.get(nome) ?? 0) + l.valorCentavos - l.taxaDescontadaCentavos);
  }
  const dadosFormas: FatiaForma[] = [...porForma.entries()]
    .map(([nome, v]) => ({ nome, valor: v / 100 }))
    .sort((a, b) => b.valor - a.valor);

  // Saídas por categoria (barra).
  const porCategoria = new Map<string, number>();
  for (const l of lancamentos) {
    if (l.tipo !== "SAIDA") continue;
    const nome = l.categoria?.nome ?? "Sem categoria";
    porCategoria.set(nome, (porCategoria.get(nome) ?? 0) + l.valorCentavos);
  }
  const dadosCategorias: FatiaCategoria[] = [...porCategoria.entries()]
    .map(([nome, v]) => ({ nome, valor: v / 100 }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-muted">Escolha um período e analise os lançamentos.</p>
      </div>

      <SeletorPeriodo
        atual={periodo.id}
        deInicial={iso(periodo.inicio)}
        ateInicial={iso(periodo.fim)}
      />

      <div className="text-sm text-muted mb-4">
        Mostrando <strong className="text-foreground">{periodo.label}</strong> ·{" "}
        {formatData(periodo.inicio)} a {formatData(periodo.fim)}
      </div>

      {/* Cartões-resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card titulo="Entradas (líq.)" valor={formatBRL(entradasLiq)} cor="text-primary" />
        <Card titulo="Saídas" valor={formatBRL(saidas)} cor="text-danger" />
        <Card
          titulo="Resultado"
          valor={`${resultado < 0 ? "−" : ""}${formatBRL(Math.abs(resultado))}`}
          cor={resultado >= 0 ? "text-primary" : "text-danger"}
          destaque
        />
        <Card titulo="Lançamentos" valor={lancamentos.length.toLocaleString("pt-BR")} cor="text-foreground" />
      </div>

      {/* Gráficos */}
      <Painel titulo="Fluxo de caixa no período">
        <GraficoFluxo dados={serie} />
      </Painel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Painel titulo="Entradas por forma de pagamento" semMargem>
          <GraficoFormas dados={dadosFormas} />
        </Painel>
        <Painel titulo="Saídas por categoria" semMargem>
          <GraficoCategorias dados={dadosCategorias} />
        </Painel>
      </div>

      {/* Lista de lançamentos */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Lançamentos do período</h2>
          <span className="text-xs text-muted">{lancamentos.length} no total</span>
        </div>

        {lancamentos.length === 0 ? (
          <div className="p-10 text-center text-muted">
            Nenhum lançamento neste período.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background text-muted">
                <tr>
                  <th className="text-left font-medium px-5 py-3 whitespace-nowrap">Data</th>
                  <th className="text-left font-medium px-5 py-3">Descrição</th>
                  <th className="text-left font-medium px-5 py-3 hidden sm:table-cell">Categoria</th>
                  <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Pagamento</th>
                  <th className="text-right font-medium px-5 py-3">Valor</th>
                </tr>
              </thead>
              <tbody>
                {lancamentos.map((l) => {
                  const valorEfetivo =
                    l.tipo === "ENTRADA"
                      ? l.valorCentavos - l.taxaDescontadaCentavos
                      : l.valorCentavos;
                  return (
                    <tr key={l.id} className="border-t border-border">
                      <td className="px-5 py-3 whitespace-nowrap text-muted">
                        {formatData(l.data)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={l.tipo === "ENTRADA" ? "text-primary" : "text-danger"}>
                          {l.tipo === "ENTRADA" ? "↑" : "↓"}
                        </span>{" "}
                        {l.descricao}
                        {l.fornecedor && <span className="text-muted"> · {l.fornecedor}</span>}
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell text-muted">
                        {l.categoria?.nome ?? "—"}
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell text-muted">
                        {l.formaPagamento ? nomeForma.get(l.formaPagamento) ?? l.formaPagamento : "—"}
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-medium ${
                          l.tipo === "ENTRADA" ? "text-primary" : "text-danger"
                        }`}
                      >
                        {l.tipo === "ENTRADA" ? "+" : "−"}
                        {formatBRL(valorEfetivo)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-muted">
        Precisa de outro recorte?{" "}
        <Link href="/lancamentos" className="text-primary underline">
          Ver todos os lançamentos
        </Link>
        .
      </p>
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
      <div className="text-xs text-muted mb-1">{titulo}</div>
      <div className={`text-xl font-bold ${cor}`}>{valor}</div>
    </div>
  );
}

function Painel({
  titulo,
  children,
  semMargem,
}: {
  titulo: string;
  children: React.ReactNode;
  semMargem?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${semMargem ? "" : "mb-6"}`}>
      <h2 className="font-semibold mb-4">{titulo}</h2>
      {children}
    </div>
  );
}
