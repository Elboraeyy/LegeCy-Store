import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const items = await prisma.orderItem.findMany({
    where: {
      OR: [
        { sku: 'W0038' },
        { variant: { sku: 'W0038' } }
      ],
      order: {
        orderNumber: { in: ['A019', 'A020', 'A029', 'A030'] }
      }
    },
    include: {
      order: true
    },
    orderBy: {
      order: { createdAt: 'asc' }
    }
  });

  console.log(`Found ${items.length} Tiffany Dial items:`);
  for (const item of items) {
    console.log(`- Order: #${item.order.orderNumber}, Item ID: ${item.id}, Name: ${item.name}, CreatedAt: ${item.order.createdAt.toISOString()}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
