import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { NovoLancamento } from "./NovoLancamento";

export default async function NovoLancamentoPage() {
  const estab = await getEstabelecimentoAtual();

  const [categorias, formasPagamento] = await Promise.all([
    prisma.categoria.findMany({
      where: { estabelecimentoId: estab.id },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, tipo: true },
    }),
    prisma.formaPagamento.findMany({
      where: { estabelecimentoId: estab.id },
      orderBy: { nome: "asc" },
      select: { slug: true, nome: true, percentualCentesimos: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Novo lançamento</h1>
      <p className="text-muted mb-6">Registre manualmente ou por foto da nota.</p>
      <NovoLancamento categorias={categorias} formasPagamento={formasPagamento} />
    </div>
  );
}
