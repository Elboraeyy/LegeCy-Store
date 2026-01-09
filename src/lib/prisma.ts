import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton with Connection Optimizations
 * 
 * Optimizations for Neon Serverless:
 * - Connection pooling settings
 * - Lazy connection (only connects when needed)
 * - Proper connection handling for serverless
 */

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    // Datasource configuration is handled via DATABASE_URL
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

// Only cache in development to avoid memory leaks in serverless
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Utility function to check database connection
 * Use this for health checks and warmup
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Graceful shutdown handler
 * Important for serverless environments
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
