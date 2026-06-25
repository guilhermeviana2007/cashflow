import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { ImportadorNota } from "./ImportadorNota";

export default async function ImportarNotaPage() {
  const estab = await getEstabelecimentoAtual();
  const categorias = await prisma.categoria.findMany({
    where: { estabelecimentoId: estab.id, tipo: "SAIDA" },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Importar nota com IA 🤖</h1>
      <p className="text-muted mb-6">
        Envie a foto de uma nota fiscal e a IA preenche a saída pra você confirmar.
      </p>
      <ImportadorNota categorias={categorias} />
    </div>
  );
}
