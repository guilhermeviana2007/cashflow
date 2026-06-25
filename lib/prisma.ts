import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [{ emit: "stdout", level: "error" }, { emit: "stdout", level: "warn" }]
        : [],
  });

// Sempre salva globalmente — em serverless (Vercel), reutiliza a conexão
// entre requests na mesma instância ao invés de abrir uma nova a cada vez.
globalForPrisma.prisma = prisma;
