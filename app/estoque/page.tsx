import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { EstoqueLista } from "./EstoqueLista";

export default async function EstoquePage() {
  const estab = await getEstabelecimentoAtual();

  const produtos = await prisma.produtoEstoque.findMany({
    where: { estabelecimentoId: estab.id },
    orderBy: [{ tipo: "asc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      tipo: true,
      unidade: true,
      quantidadeAtual: true,
      quantidadeIdeal: true,
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Estoque</h1>
        <p className="text-muted">
          Faça a contagem no fim do expediente. O sistema avisa quando algo fica abaixo do
          mínimo ideal.
        </p>
      </div>

      <EstoqueLista produtos={produtos} />
    </div>
  );
}
