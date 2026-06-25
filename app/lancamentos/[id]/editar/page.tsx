import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { FormEditar } from "./FormEditar";

export default async function EditarLancamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const estab = await getEstabelecimentoAtual();

  const lancamento = await prisma.lancamento.findFirst({
    where: { id, estabelecimentoId: estab.id },
  });

  if (!lancamento) notFound();

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

  const dataISO = lancamento.data.toISOString().slice(0, 10);
  const valorFormatado = (lancamento.valorCentavos / 100).toFixed(2).replace(".", ",");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Editar lançamento</h1>
      <p className="text-muted mb-6">Altere os dados e salve.</p>
      <FormEditar
        lancamento={{
          id: lancamento.id,
          tipo: lancamento.tipo as "ENTRADA" | "SAIDA",
          descricao: lancamento.descricao,
          valor: valorFormatado,
          data: dataISO,
          categoriaId: lancamento.categoriaId ?? "",
          fornecedor: lancamento.fornecedor ?? "",
          formaPagamento: lancamento.formaPagamento ?? "",
        }}
        categorias={categorias}
        formasPagamento={formasPagamento}
      />
    </div>
  );
}
