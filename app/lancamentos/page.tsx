import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { formatBRL, formatData } from "@/lib/format";
import { calcularSaldoAtual } from "@/lib/saldo";
import { excluirLancamento } from "./actions";

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lançamentos</h1>
          <p className="text-muted">Histórico de entradas e saídas.</p>
        </div>
        <Link
          href="/lancamentos/novo"
          className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90"
        >
          + Novo
        </Link>
      </div>

      {/* Saldo atual do caixa */}
      <div
        className={`rounded-xl border p-4 mb-4 flex items-center justify-between ${
          saldoAtual >= 0
            ? "border-primary/30 bg-primary/5"
            : "border-danger/30 bg-danger/5"
        }`}
      >
        <div>
          <div className="text-xs text-muted mb-0.5">Saldo atual do caixa</div>
          <div
            className={`text-2xl font-bold ${
              saldoAtual >= 0 ? "text-primary" : "text-danger"
            }`}
          >
            {formatBRL(saldoAtual)}
          </div>
        </div>
        {estab.saldoInicialData && (
          <div className="text-xs text-muted text-right">
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
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Resumo titulo="Entradas líq." valor={entradas} cor="text-primary" />
        <Resumo titulo="Saídas" valor={saidas} cor="text-danger" />
        <Resumo titulo="Resultado" valor={entradas - saidas} cor="text-foreground" />
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {lancamentos.length === 0 ? (
          <div className="p-10 text-center text-muted">
            Nenhum lançamento ainda.{" "}
            <Link href="/lancamentos/novo" className="text-primary underline">
              Criar o primeiro
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-background text-muted">
              <tr>
                <th className="text-left font-medium px-4 py-3">Data</th>
                <th className="text-left font-medium px-4 py-3">Descrição</th>
                <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">
                  Categoria
                </th>
                <th className="text-right font-medium px-4 py-3">Valor</th>
                <th className="px-4 py-3"></th>
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
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {formatData(l.data)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          l.tipo === "ENTRADA" ? "text-primary" : "text-danger"
                        }
                      >
                        {l.tipo === "ENTRADA" ? "↑" : "↓"}
                      </span>{" "}
                      {l.descricao}
                      {l.fornecedor && (
                        <span className="text-muted"> · {l.fornecedor}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted">
                      {l.categoria?.nome ?? "—"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        l.tipo === "ENTRADA" ? "text-primary" : "text-danger"
                      }`}
                    >
                      {l.tipo === "ENTRADA" ? "+" : "−"}
                      {formatBRL(valorEfetivo)}
                      {l.taxaDescontadaCentavos > 0 && (
                        <div className="text-xs text-muted font-normal leading-tight mt-0.5">
                          bruto {formatBRL(l.valorCentavos)} · taxa −
                          {formatBRL(l.taxaDescontadaCentavos)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/lancamentos/${l.id}/editar`}
                          className="text-muted hover:text-primary"
                          title="Editar"
                        >
                          ✎
                        </Link>
                        <form action={excluirLancamento}>
                          <input type="hidden" name="id" value={l.id} />
                          <button
                            type="submit"
                            className="text-muted hover:text-danger"
                            title="Excluir"
                          >
                            ✕
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
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
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted mb-1">{titulo}</div>
      <div className={`text-xl font-bold ${cor}`}>{formatBRL(valor)}</div>
    </div>
  );
}
