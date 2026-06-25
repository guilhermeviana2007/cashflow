import { prisma } from "@/lib/prisma";
import { formatBRL, formatData } from "@/lib/format";

export default async function AdminPage() {
  const [totalUsuarios, totalEstab, totalLancamentos, volumeResult] = await Promise.all([
    prisma.usuario.count(),
    prisma.estabelecimento.count(),
    prisma.lancamento.count(),
    prisma.lancamento.aggregate({
      where: { tipo: "ENTRADA" },
      _sum: { valorCentavos: true },
    }),
  ]);

  const volumeTotal = volumeResult._sum.valorCentavos ?? 0;

  const usuarios = await prisma.usuario.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      estabelecimentos: {
        include: {
          _count: { select: { lancamentos: true } },
        },
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Visão geral do sistema</h1>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard titulo="Usuários" valor={totalUsuarios.toString()} />
        <StatCard titulo="Estabelecimentos" valor={totalEstab.toString()} />
        <StatCard titulo="Lançamentos" valor={totalLancamentos.toLocaleString("pt-BR")} />
        <StatCard titulo="Volume total de entradas" valor={formatBRL(volumeTotal)} destaque />
      </div>

      {/* Tabela de usuários */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Clientes cadastrados</h2>
          <p className="text-xs text-muted mt-0.5">
            {totalUsuarios} usuário{totalUsuarios !== 1 ? "s" : ""} no sistema
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background text-muted">
              <tr>
                <th className="text-left font-medium px-5 py-3">E-mail</th>
                <th className="text-left font-medium px-5 py-3">Estabelecimento</th>
                <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Tipo</th>
                <th className="text-right font-medium px-5 py-3">Lançamentos</th>
                <th className="text-right font-medium px-5 py-3 hidden lg:table-cell">
                  Cadastro
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) =>
                u.estabelecimentos.length === 0 ? (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-5 py-3 text-muted">{u.email}</td>
                    <td className="px-5 py-3 text-muted italic" colSpan={4}>
                      Sem estabelecimento
                    </td>
                  </tr>
                ) : (
                  u.estabelecimentos.map((estab, idx) => (
                    <tr key={estab.id} className="border-t border-border">
                      <td className="px-5 py-3">
                        {idx === 0 ? (
                          <span className="font-medium">{u.email}</span>
                        ) : (
                          <span className="text-muted text-xs">↳</span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-medium">{estab.nome}</td>
                      <td className="px-5 py-3 hidden md:table-cell text-muted capitalize">
                        {estab.tipo}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {estab._count.lancamentos.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-5 py-3 text-right hidden lg:table-cell text-muted">
                        {idx === 0 ? formatData(u.createdAt) : ""}
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>

          {totalUsuarios === 0 && (
            <div className="p-10 text-center text-muted">Nenhum usuário cadastrado ainda.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  titulo,
  valor,
  destaque,
}: {
  titulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        destaque ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="text-xs text-muted mb-1">{titulo}</div>
      <div className={`text-xl font-bold ${destaque ? "text-primary" : "text-foreground"}`}>
        {valor}
      </div>
    </div>
  );
}
