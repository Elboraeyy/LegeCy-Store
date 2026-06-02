import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== CAPITAL TRANSACTIONS ===');
  const capTxs = await prisma.capitalTransaction.findMany();
  capTxs.forEach(tx => {
    console.log(`- ID: ${tx.id}, InvestorId: ${tx.investorId}, Amount: ${tx.amount}, Type: ${tx.type}, Desc: "${tx.description}", Date: ${tx.date.toISOString()}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
