import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DEBUGGING DISCREPANCIES ---');

  // 1. Query Rolex Land Dweller Silver Dial (w0041)
  console.log('\n[Rolex Land Dweller Silver Dial (w0041)]:');
  const silverProduct = await prisma.product.findFirst({
    where: {
      OR: [
        { name: { contains: 'Land Dweller Silver' } },
        { id: 'w0041' }
      ]
    },
    include: {
      variants: {
        include: {
          inventory: true
        }
      }
    }
  });

  if (silverProduct) {
    console.log(`Product Name: ${silverProduct.name}, ID: ${silverProduct.id}`);
    console.log(`Specs: ${JSON.stringify(silverProduct.specs)}`);
    console.log('Variants:');
    for (const v of silverProduct.variants) {
      console.log(`  - Variant SKU: ${v.sku}, ID: ${v.id}, costPrice: ${v.costPrice}`);
      console.log(`    Inventory: ${JSON.stringify(v.inventory)}`);
    }
  } else {
    console.log('Silver Dial Product NOT found');
  }

  // 2. Query Rolex Land Dweller Tiffany Dial (W0038)
  console.log('\n[Rolex Land Dweller Tiffany Dial (W0038)]:');
  const tiffanyProduct = await prisma.product.findFirst({
    where: {
      OR: [
        { name: { contains: 'Land Dweller Tiffany' } },
        { id: 'W0038' }
      ]
    },
    include: {
      variants: {
        include: {
          inventory: true
        }
      }
    }
  });

  if (tiffanyProduct) {
    console.log(`Product Name: ${tiffanyProduct.name}, ID: ${tiffanyProduct.id}`);
    console.log(`Specs: ${JSON.stringify(tiffanyProduct.specs)}`);
    console.log('Variants:');
    for (const v of tiffanyProduct.variants) {
      console.log(`  - Variant SKU: ${v.sku}, ID: ${v.id}, costPrice: ${v.costPrice}`);
      console.log(`    Inventory: ${JSON.stringify(v.inventory)}`);
    }
  }

  // 3. Find all orders containing Rolex Land Dweller Silver (w0041) or Tiffany (W0038)
  console.log('\n[Order Items for Land Dweller (w0041 & W0038)]:');
  const orderItems = await prisma.orderItem.findMany({
    where: {
      productId: { in: [silverProduct?.id || 'w0041', tiffanyProduct?.id || 'W0038'] }
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          isFinanciallyAudited: true,
          deliveredAt: true,
        }
      }
    }
  });

  for (const item of orderItems) {
    console.log(`  - Order #${item.order.orderNumber} (${item.order.status}): Qty: ${item.quantity}, Price: ${item.price}, costAtPurchase: ${item.costAtPurchase}, isAudited: ${item.order.isFinanciallyAudited}, ProductName: ${item.name}`);
  }

  // 4. Find all order items that have EGP 0 or null costAtPurchase in audited orders
  console.log('\n[Audited Order Items with 0 or null costAtPurchase]:');
  const zeroCostItems = await prisma.orderItem.findMany({
    where: {
      order: { isFinanciallyAudited: true },
      OR: [
        { costAtPurchase: null },
        { costAtPurchase: 0 }
      ]
    },
    include: {
      order: { select: { orderNumber: true } }
    }
  });
  for (const item of zeroCostItems) {
    console.log(`  - Order #${item.order.orderNumber}: Item: ${item.name}, costAtPurchase: ${item.costAtPurchase}`);
  }

  // 5. Total number of orders and audited orders
  const totalOrders = await prisma.order.count();
  const auditedOrders = await prisma.order.count({ where: { isFinanciallyAudited: true } });
  const deliveredOrders = await prisma.order.count({ where: { status: 'delivered' } });
  console.log(`\nTotals: Total Orders: ${totalOrders}, Delivered: ${deliveredOrders}, Audited: ${auditedOrders}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
