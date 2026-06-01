import prismaClient from '../src/lib/prisma';
const prisma = prismaClient!;

async function main() {
  const categories = await prisma.expenseCategory.findMany({
    where: { parentId: null },
    include: { children: true }
  });
  console.log("Prisma Categories count:", categories.length);
  console.log("Mapped Categories:", JSON.stringify(categories.map(c => ({
    id: c.id,
    name: c.name,
    children: c.children.map(ch => ({ id: ch.id, name: ch.name })),
  })), null, 2));
}

main().catch(console.error);
