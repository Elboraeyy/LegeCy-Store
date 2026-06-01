import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating existing "مشتريات بضائع" expenses to CAPITAL...');
  const result = await prisma.expense.updateMany({
    where: {
      category: {
        name: 'مشتريات بضائع'
      }
    },
    data: {
      expenseType: 'CAPITAL'
    }
  });
  console.log(`Successfully updated ${result.count} expenses to CAPITAL.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
