import { PrismaClient } from "@prisma/client";

// Singleton do Prisma — evita abrir múltiplas conexões durante o hot-reload do dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
