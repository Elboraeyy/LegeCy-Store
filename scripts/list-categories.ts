import prismaClient from '../src/lib/prisma';
const prisma = prismaClient!;

async function main() {
  const categories = await prisma.expenseCategory.findMany({
    include: { children: true }
  });
  console.log("Database Categories:", JSON.stringify(categories, null, 2));
}

main().catch(console.error);
