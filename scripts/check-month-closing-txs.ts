import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== CHECKING ALL MONTH CLOSING SAFE TRANSACTIONS ===');
  const safeTxs = await prisma.safeTransaction.findMany({
    where: { referenceType: 'MONTH_CLOSING' }
  });
  console.log(`Found ${safeTxs.length} SafeTransactions with referenceType 'MONTH_CLOSING':`);
  safeTxs.forEach(tx => {
    console.log(`- ID: ${tx.id}, SafeId: ${tx.safeId}, Amount: ${tx.amount}, Type: ${tx.type}, Desc: "${tx.description}", Date: ${tx.createdAt.toISOString()}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
