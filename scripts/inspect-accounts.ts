import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== ACCOUNTS ===');
  const accounts = await prisma.account.findMany();
  for (const acc of accounts) {
    console.log(`ID: ${acc.id}, Code: ${acc.code}, Name: ${acc.name}, Balance: ${acc.balance.toNumber()}, Type: ${acc.type}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
