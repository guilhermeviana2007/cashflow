import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { formatBRL } from "@/lib/format";
import { gerarCustosFixosDoMes } from "@/lib/custos-fixos";

type MesInfo = {
  ano: number;
  mes: number;
  label: string;
  inicio: Date;
  fim: Date;
};

const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function ultimosSeisMeses(): MesInfo[] {
  const hoje = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
    return {
      ano: d.getFullYear(),
      mes: d.getMonth(),
      label: `${NOMES_MES[d.getMonth()]} de ${d.getFullYear()}`,
      inicio: new Date(d.getFullYear(), d.getMonth(), 1),
      fim: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
    };
  });
}

export default async function RelatoriosPage() {
  const estab = await getEstabelecimentoAtual();
  await gerarCustosFixosDoMes(estab.id);

  const meses = ultimosSeisMeses();
  const inicio = meses[0].inicio;
  const fim = meses[meses.length - 1].fim;

  const [lancamentos, formasPagamento] = await Promise.all([
    prisma.lancamento.findMany({
      where: { estabelecimentoId: estab.id, data: { gte: inicio, lte: fim } },
      include: { categoria: true },
    }),
    prisma.formaPagamento.findMany({
      where: { estabelecimentoId: estab.id },
      select: { slug: true, percentualCentesimos: true },
    }),
  ]);

  // Mapa slug → taxa para calcular valor líquido das entradas
  const taxaMap = new Map(formasPagamento.map((f) => [f.slug, f.percentualCentesimos]));

  function valorLiquido(valorCentavos: number, formaPgto: string | null): number {
    if (!formaPgto) return valorCentavos;
    const taxa = taxaMap.get(formaPgto) ?? 0;
    if (taxa === 0) return valorCentavos;
    return Math.round(valorCentavos * (10000 - taxa) / 10000);
  }

  type LinhaRelatorio = {
    label: string;
    entradasBruto: number;
    entradasLiquido: number;
    taxasDescontadas: number;
    saidasProd: number;
    saidasOp: number;
    saidasTotal: number;
    resultado: number;
    margem: number | null;
  };

  const linhas: LinhaRelatorio[] = meses.map((m) => {
    const doMes = lancamentos.filter((l) => l.data >= m.inicio && l.data <= m.fim);

    const entradasBruto = doMes
      .filter((l) => l.tipo === "ENTRADA")
      .reduce((s, l) => s + l.valorCentavos, 0);

    const entradasLiquido = doMes
      .filter((l) => l.tipo === "ENTRADA")
      .reduce((s, l) => s + valorLiquido(l.valorCentavos, l.formaPagamento), 0);

    const taxasDescontadas = entradasBruto - entradasLiquido;

    const saidasProd = doMes
      .filter((l) => l.tipo === "SAIDA" && l.categoria?.grupoDre === "CMV")
      .reduce((s, l) => s + l.valorCentavos, 0);

    const saidasOp = doMes
      .filter((l) => l.tipo === "SAIDA" && l.categoria?.grupoDre !== "CMV")
      .reduce((s, l) => s + l.valorCentavos, 0);

    const saidasTotal = saidasProd + saidasOp;
    const resultado = entradasLiquido - saidasTotal;
    const margem = entradasLiquido > 0 ? (resultado / entradasLiquido) * 100 : null;

    return { label: m.label, entradasBruto, entradasLiquido, taxasDescontadas, saidasProd, saidasOp, saidasTotal, resultado, margem };
  });

  const totEntradasLiquido = linhas.reduce((s, l) => s + l.entradasLiquido, 0);
  const totSaidas = linhas.reduce((s, l) => s + l.saidasTotal, 0);
  const totResultado = totEntradasLiquido - totSaidas;
  const totMargem = totEntradasLiquido > 0 ? (totResultado / totEntradasLiquido) * 100 : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-muted">
          Margem = quanto sobra de cada R$ 100 que entra (já descontadas as taxas de pagamento).
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Performance dos últimos 6 meses</h2>
          <p className="text-xs text-muted mt-0.5">
            P = Produtos (CMV) · O = Outros (operacional, fixos, etc.)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background text-muted">
              <tr>
                <th className="text-left font-medium px-5 py-3">Mês</th>
                <th className="text-right font-medium px-5 py-3">Entradas (líq.)</th>
                <th className="text-right font-medium px-5 py-3">Saídas</th>
                <th className="text-right font-medium px-5 py-3">Resultado</th>
                <th className="text-right font-medium px-5 py-3">Margem</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.label} className="border-t border-border">
                  <td className="px-5 py-4 font-medium">{l.label}</td>

                  <td className="px-5 py-4 text-right">
                    <div className="text-primary font-medium">{formatBRL(l.entradasLiquido)}</div>
                    {l.taxasDescontadas > 0 && (
                      <div className="text-xs text-muted mt-0.5">
                        bruto {formatBRL(l.entradasBruto)} · taxas −{formatBRL(l.taxasDescontadas)}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="text-danger font-medium">{formatBRL(l.saidasTotal)}</div>
                    {l.saidasTotal > 0 && (
                      <div className="text-xs text-muted mt-0.5">
                        P {formatBRL(l.saidasProd)} · O {formatBRL(l.saidasOp)}
                      </div>
                    )}
                  </td>

                  <td
                    className={`px-5 py-4 text-right font-bold ${
                      l.resultado >= 0 ? "text-primary" : "text-danger"
                    }`}
                  >
                    {l.resultado < 0 ? "−" : ""}
                    {formatBRL(Math.abs(l.resultado))}
                  </td>

                  <td className="px-5 py-4 text-right text-muted">
                    {l.margem === null ? "—" : `${l.margem.toFixed(1)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-border bg-background">
              <tr>
                <td className="px-5 py-3 font-semibold text-muted">Total</td>
                <td className="px-5 py-3 text-right font-semibold text-primary">
                  {formatBRL(totEntradasLiquido)}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-danger">
                  {formatBRL(totSaidas)}
                </td>
                <td
                  className={`px-5 py-3 text-right font-bold text-lg ${
                    totResultado >= 0 ? "text-primary" : "text-danger"
                  }`}
                >
                  {totResultado < 0 ? "−" : ""}
                  {formatBRL(Math.abs(totResultado))}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-muted">
                  {totMargem === null ? "—" : `${totMargem.toFixed(1)}%`}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
