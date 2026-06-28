import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { MARKETPLACES_SUGERIDOS } from "@/lib/plano-de-contas";
import { MarketplacesClient } from "./MarketplacesClient";

export default async function MarketplacesPage() {
  const estab = await getEstabelecimentoAtual();

  const [marketplaces, repasses] = await Promise.all([
    prisma.marketplace.findMany({
      where: { estabelecimentoId: estab.id },
      orderBy: { nome: "asc" },
    }),
    prisma.lancamento.findMany({
      where: { estabelecimentoId: estab.id, origem: "MARKETPLACE" },
      orderBy: { data: "desc" },
      take: 30,
      select: {
        id: true,
        descricao: true,
        valorCentavos: true,
        data: true,
        fornecedor: true,
      },
    }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Marketplaces</h1>
        <p className="text-muted text-sm">
          Registre os repasses dos apps de delivery diretamente no caixa.
        </p>
      </div>

      <MarketplacesClient
        sugeridos={MARKETPLACES_SUGERIDOS}
        marketplaces={marketplaces}
        repasses={repasses}
      />
    </div>
  );
}
