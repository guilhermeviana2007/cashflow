import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { FORMAS_PAGAMENTO_PADRAO } from "@/lib/plano-de-contas";
import { salvarSaldoInicial, salvarTaxas } from "./actions";

// Garante que o estabelecimento tem todas as formas de pagamento padrão.
// Necessário para contas criadas antes desta funcionalidade.
async function garantirFormasPagamento(estabelecimentoId: string) {
  const existentes = await prisma.formaPagamento.findMany({
    where: { estabelecimentoId },
    select: { slug: true },
  });
  const slugsExistentes = new Set(existentes.map((f) => f.slug));
  const faltando = FORMAS_PAGAMENTO_PADRAO.filter((f) => !slugsExistentes.has(f.slug));
  if (faltando.length > 0) {
    await prisma.formaPagamento.createMany({
      data: faltando.map((f) => ({ ...f, estabelecimentoId })),
    });
  }
}

export default async function ConfiguracoesPage() {
  const estab = await getEstabelecimentoAtual();
  await garantirFormasPagamento(estab.id);

  const formas = await prisma.formaPagamento.findMany({
    where: { estabelecimentoId: estab.id },
    orderBy: { nome: "asc" },
  });

  const saldoInicialFormatado =
    estab.saldoInicialCentavos > 0
      ? (estab.saldoInicialCentavos / 100).toFixed(2).replace(".", ",")
      : "";

  const dataFormatada = estab.saldoInicialData
    ? estab.saldoInicialData.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configuração do Caixa</h1>
        <p className="text-muted">
          Defina de onde o caixa começa a contar e a taxa padrão de cada forma de pagamento.
        </p>
      </div>

      {/* Saldo inicial */}
      <section className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="font-semibold mb-1">Saldo inicial</h2>
        <p className="text-sm text-muted mb-5">
          Quanto havia no caixa quando você começou a usar o sistema, e a partir de que dia contar.
        </p>

        <form action={salvarSaldoInicial} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-muted">
                Saldo inicial (R$)
              </span>
              <input
                name="saldoInicial"
                inputMode="decimal"
                defaultValue={saldoInicialFormatado}
                placeholder="0,00"
                className="inp"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-muted">
                Contar a partir de
              </span>
              <input
                name="saldoInicialData"
                type="date"
                defaultValue={dataFormatada}
                className="inp"
              />
            </label>
          </div>

          <p className="text-xs text-muted">
            O saldo do caixa é sempre{" "}
            <strong className="text-foreground">calculado</strong>: saldo inicial + tudo que entrou
            e saiu a partir do dia escolhido. Movimentos anteriores a esse dia não entram na conta.
          </p>

          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:opacity-90"
          >
            Salvar saldo inicial
          </button>
        </form>
      </section>

      {/* Taxas por forma de pagamento */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold mb-1">Taxas por forma de pagamento</h2>
        <p className="text-sm text-muted mb-5">
          A taxa que cada forma desconta. Usada no relatório para calcular as entradas líquidas.
        </p>

        <form action={salvarTaxas} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {formas.map((f) => (
              <label key={f.id} className="block">
                <span className="mb-1.5 block text-sm font-medium text-muted">
                  {f.nome} (%)
                </span>
                <div className="relative">
                  <input
                    name={`rate-${f.id}`}
                    inputMode="decimal"
                    defaultValue={
                      f.percentualCentesimos > 0
                        ? (f.percentualCentesimos / 100).toFixed(1).replace(".", ",")
                        : "0"
                    }
                    placeholder="0"
                    className="inp pr-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none">
                    %
                  </span>
                </div>
              </label>
            ))}
          </div>

          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:opacity-90"
          >
            Salvar taxas
          </button>
        </form>
      </section>

      <style>{`
        .inp {
          width: 100%;
          border: 1px solid var(--border);
          background: var(--background);
          color: var(--foreground);
          border-radius: 0.5rem;
          padding: 0.6rem 0.75rem;
          font-size: 0.95rem;
          outline: none;
        }
        .inp:focus { border-color: var(--primary); }
        input[type="date"].inp { color-scheme: dark; }
      `}</style>
    </div>
  );
}
