-- CreateTable
CREATE TABLE "CustoFixo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoriaId" TEXT,
    "estabelecimentoId" TEXT NOT NULL,
    CONSTRAINT "CustoFixo_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CustoFixo_estabelecimentoId_fkey" FOREIGN KEY ("estabelecimentoId") REFERENCES "Estabelecimento" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lancamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
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
INSERT INTO "new_Lancamento" ("categoriaId", "createdAt", "data", "descricao", "estabelecimentoId", "formaPagamento", "fornecedor", "id", "origem", "status", "tipo", "valorCentavos") SELECT "categoriaId", "createdAt", "data", "descricao", "estabelecimentoId", "formaPagamento", "fornecedor", "id", "origem", "status", "tipo", "valorCentavos" FROM "Lancamento";
DROP TABLE "Lancamento";
ALTER TABLE "new_Lancamento" RENAME TO "Lancamento";
CREATE INDEX "Lancamento_estabelecimentoId_data_idx" ON "Lancamento"("estabelecimentoId", "data");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CustoFixo_estabelecimentoId_idx" ON "CustoFixo"("estabelecimentoId");
