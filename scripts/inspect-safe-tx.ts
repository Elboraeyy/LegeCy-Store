import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== SAFE TRANSACTIONS ===');
  const txs = await prisma.safeTransaction.findMany({
    orderBy: { createdAt: 'asc' }
  });
  for (const tx of txs) {
    console.log(`Date: ${tx.createdAt.toISOString()}, Type: ${tx.type}, Amount: ${tx.amount.toNumber()}, Balance After: ${tx.balanceAfter.toNumber()}, Desc: ${tx.description}, Ref: ${tx.referenceType} (${tx.referenceId})`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
