import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Explicit named re-exports so workspace consumers (via dist/*.d.ts) can import
// enums/namespaces that `export *` alone does not always surface under tsc.
export { PrismaClient, Prisma, RideStatus, $Enums } from '@prisma/client';
export * from '@prisma/client';
export default prisma;
