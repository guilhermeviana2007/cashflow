-- CreateTable
CREATE TABLE "TaxaPagamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "percentualCentesimos" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estabelecimentoId" TEXT NOT NULL,
    CONSTRAINT "TaxaPagamento_estabelecimentoId_fkey" FOREIGN KEY ("estabelecimentoId") REFERENCES "Estabelecimento" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TaxaPagamento_estabelecimentoId_idx" ON "TaxaPagamento"("estabelecimentoId");
