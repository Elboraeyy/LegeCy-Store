import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== EXPENSE CATEGORIES ===');
  const categories = await prisma.expenseCategory.findMany();
  for (const cat of categories) {
    console.log(`ID: ${cat.id}, Name: ${cat.name}, parentId: ${cat.parentId}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
