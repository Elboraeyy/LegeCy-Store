import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton with Connection Optimizations
 * 
 * Optimizations for Neon Serverless:
 * - Connection pooling settings
 * - Lazy connection (only connects when needed)
 * - Proper connection handling for serverless
 */

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  if (!url.includes('connection_limit=')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}connection_limit=3&pool_timeout=30`;
  }
  return url;
};

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasourceUrl: getDatabaseUrl(),
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

// Cache globally to reuse client and prevent connection exhaustion across requests/workers
globalForPrisma.prisma = prisma;

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
