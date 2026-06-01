import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        orderNumber: { in: ['A002', 'A003', 'A010', 'A028'] }
      }
    },
    include: {
      order: true,
      variant: true,
      product: true
    }
  });

  console.log(`Found ${items.length} items to inspect:`);
  for (const item of items) {
    console.log(`- Order: #${item.order.orderNumber}, Item ID: ${item.id}, Name: ${item.name}, SKU field: ${item.sku}, Variant SKU: ${item.variant?.sku}, Product Name: ${item.product?.name}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
