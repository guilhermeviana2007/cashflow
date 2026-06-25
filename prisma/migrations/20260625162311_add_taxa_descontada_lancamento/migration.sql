-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lancamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "taxaDescontadaCentavos" INTEGER NOT NULL DEFAULT 0,
    "data" DATETIME NOT NULL,
    "fornecedor" TEXT,
    "formaPagamento" TEXT,
    "origem" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'CONFIRMADO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoriaId" TEXT,
    "custoFixoId" TEXT,
    "estabelecimentoId" TEXT NOT NULL,
    CONSTRAINT "Lancamento_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lancamento_custoFixoId_fkey" FOREIGN KEY ("custoFixoId") REFERENCES "CustoFixo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lancamento_estabelecimentoId_fkey" FOREIGN KEY ("estabelecimentoId") REFERENCES "Estabelecimento" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Lancamento" ("categoriaId", "createdAt", "custoFixoId", "data", "descricao", "estabelecimentoId", "formaPagamento", "fornecedor", "id", "origem", "status", "tipo", "valorCentavos") SELECT "categoriaId", "createdAt", "custoFixoId", "data", "descricao", "estabelecimentoId", "formaPagamento", "fornecedor", "id", "origem", "status", "tipo", "valorCentavos" FROM "Lancamento";
DROP TABLE "Lancamento";
ALTER TABLE "new_Lancamento" RENAME TO "Lancamento";
CREATE INDEX "Lancamento_estabelecimentoId_data_idx" ON "Lancamento"("estabelecimentoId", "data");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
