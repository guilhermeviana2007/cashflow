-- Drop old TaxaPagamento table (replaced by FormaPagamento with fixed slugs)
DROP TABLE "TaxaPagamento";

-- Add saldo inicial fields to Estabelecimento
ALTER TABLE "Estabelecimento" ADD COLUMN "saldoInicialCentavos" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Estabelecimento" ADD COLUMN "saldoInicialData" DATETIME;

-- Create FormaPagamento table
CREATE TABLE "FormaPagamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "percentualCentesimos" INTEGER NOT NULL DEFAULT 0,
    "estabelecimentoId" TEXT NOT NULL,
    CONSTRAINT "FormaPagamento_estabelecimentoId_fkey" FOREIGN KEY ("estabelecimentoId") REFERENCES "Estabelecimento" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "FormaPagamento_estabelecimentoId_slug_key" ON "FormaPagamento"("estabelecimentoId", "slug");
CREATE INDEX "FormaPagamento_estabelecimentoId_idx" ON "FormaPagamento"("estabelecimentoId");
