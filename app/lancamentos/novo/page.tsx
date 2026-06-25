import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { FormLancamento } from "./FormLancamento";

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
      <p className="text-muted mb-6">Registre uma entrada ou saída do caixa.</p>
      <FormLancamento categorias={categorias} formasPagamento={formasPagamento} />
    </div>
  );
}
