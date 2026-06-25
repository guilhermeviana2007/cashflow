import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { formatBRL } from "@/lib/format";
import { criarCustoFixo, toggleCustoFixo, excluirCustoFixo } from "./actions";

export default async function CustosFixosPage() {
  const estab = await getEstabelecimentoAtual();

  const [custos, categorias] = await Promise.all([
    prisma.custoFixo.findMany({
      where: { estabelecimentoId: estab.id },
      include: { categoria: true },
      orderBy: { nome: "asc" },
    }),
    prisma.categoria.findMany({
      where: { estabelecimentoId: estab.id, tipo: "SAIDA" },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  const totalAtivo = custos
    .filter((c) => c.ativo)
    .reduce((s, c) => s + c.valorCentavos, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Custos Fixos</h1>
        <p className="text-muted">
          Cadastre despesas recorrentes. O sistema lança automaticamente no dia
          do vencimento, todo mês.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Novo custo fixo</h2>
          <form action={criarCustoFixo} className="space-y-4">
            <Campo label="Nome do custo *">
              <input
                name="nome"
                required
                placeholder="Ex: Aluguel, Energia Elétrica, Salário"
                className="inp"
              />
            </Campo>

            <div className="grid grid-cols-2 gap-3">
              <Campo label="Valor (R$) *">
                <input
                  name="valor"
                  required
                  inputMode="decimal"
                  placeholder="0,00"
                  className="inp"
                />
              </Campo>
              <Campo label="Dia do vencimento *">
                <input
                  name="diaVencimento"
                  required
                  type="number"
                  min={1}
                  max={28}
                  placeholder="Ex: 5"
                  className="inp"
                />
              </Campo>
            </div>

            <Campo label="Categoria (opcional)">
              <select name="categoriaId" className="inp" defaultValue="">
                <option value="">— Sem categoria —</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </Campo>

            <p className="text-xs text-muted">
              Use até o dia 28 para garantir que funcione em todos os meses (incluindo fevereiro).
            </p>

            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground hover:opacity-90"
            >
              + Adicionar custo fixo
            </button>
          </form>
        </div>

        {/* Lista */}
        <div>
          {custos.length > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-3 mb-4 flex items-center justify-between">
              <span className="text-sm text-muted">Total mensal ativo</span>
              <span className="font-bold text-primary text-lg">{formatBRL(totalAtivo)}</span>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {custos.length === 0 ? (
              <div className="p-8 text-center text-muted">
                Nenhum custo fixo cadastrado ainda.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-background text-muted">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Nome</th>
                    <th className="text-right font-medium px-4 py-3">Valor</th>
                    <th className="text-center font-medium px-4 py-3">Dia</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {custos.map((c) => (
                    <tr
                      key={c.id}
                      className={`border-t border-border ${!c.ativo ? "opacity-40" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{c.nome}</div>
                        {c.categoria && (
                          <div className="text-xs text-muted">{c.categoria.nome}</div>
                        )}
                        {!c.ativo && (
                          <div className="text-xs text-muted italic">pausado</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-danger">
                        {formatBRL(c.valorCentavos)}
                      </td>
                      <td className="px-4 py-3 text-center text-muted">
                        dia {c.diaVencimento}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <form action={toggleCustoFixo}>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="ativo" value={String(c.ativo)} />
                            <button
                              type="submit"
                              className={`text-xs px-2 py-0.5 rounded border font-medium transition-colors ${
                                c.ativo
                                  ? "border-muted text-muted hover:border-primary hover:text-primary"
                                  : "border-primary text-primary hover:opacity-70"
                              }`}
                              title={c.ativo ? "Pausar" : "Reativar"}
                            >
                              {c.ativo ? "Pausar" : "Reativar"}
                            </button>
                          </form>
                          <form action={excluirCustoFixo}>
                            <input type="hidden" name="id" value={c.id} />
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
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

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
        input[type="number"].inp { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
