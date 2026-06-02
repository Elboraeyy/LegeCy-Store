import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('=== Order Date Sync Script ===\n');

  // 1. Fetch all orders sorted by createdAt
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      createdAt: true,
      deliveredAt: true,
      auditedAt: true,
      isFinanciallyAudited: true,
    },
  });

  console.log(`Found ${orders.length} orders.\n`);

  // 2. Show current state
  console.log('--- Current State ---');
  for (const o of orders) {
    const createdMonth = o.createdAt.toISOString().slice(0, 7);
    const deliveredMonth = o.deliveredAt ? o.deliveredAt.toISOString().slice(0, 7) : 'N/A';
    const mismatch = o.deliveredAt && createdMonth !== deliveredMonth ? ' ⚠️ MONTH MISMATCH' : '';
    console.log(
      `  ${o.orderNumber} | status: ${o.status} | created: ${o.createdAt.toISOString().slice(0, 10)} | delivered: ${o.deliveredAt ? o.deliveredAt.toISOString().slice(0, 10) : 'null'} | audited: ${o.isFinanciallyAudited ? 'yes' : 'no'}${mismatch}`
    );
  }

  // 3. For delivered orders, sync deliveredAt to match createdAt's date
  //    We add a small offset (e.g. +1 day) so deliveredAt is after createdAt
  const deliveredOrders = orders.filter(o => o.status === 'delivered' && o.deliveredAt);
  
  if (deliveredOrders.length === 0) {
    console.log('\nNo delivered orders to sync.');
    return;
  }

  console.log(`\n--- Syncing ${deliveredOrders.length} delivered orders ---`);
  
  let updated = 0;
  await prisma.$transaction(async (tx) => {
    for (const order of deliveredOrders) {
      // Set deliveredAt to createdAt + 1 day (to simulate delivery the next day)
      const newDeliveredAt = new Date(order.createdAt.getTime() + 24 * 60 * 60 * 1000);
      
      const oldDeliveredStr = order.deliveredAt!.toISOString().slice(0, 10);
      const newDeliveredStr = newDeliveredAt.toISOString().slice(0, 10);
      
      if (oldDeliveredStr !== newDeliveredStr) {
        // Also sync auditedAt if the order was audited
        const updateData: Record<string, Date> = {
          deliveredAt: newDeliveredAt,
        };
        
        if (order.isFinanciallyAudited && order.auditedAt) {
          // Set auditedAt to deliveredAt + a few hours
          updateData.auditedAt = new Date(newDeliveredAt.getTime() + 2 * 60 * 60 * 1000);
        }
        
        await tx.order.update({
          where: { id: order.id },
          data: updateData,
        });

        console.log(`  ${order.orderNumber}: deliveredAt ${oldDeliveredStr} → ${newDeliveredStr} <<<`);
        updated++;
      } else {
        console.log(`  ${order.orderNumber}: deliveredAt ${oldDeliveredStr} (no change)`);
      }
    }
  }, { timeout: 30000 });

  console.log(`\n✅ Synced ${updated} orders. deliveredAt now matches createdAt for all delivered orders.`);
}

main()
  .catch((e) => {
    console.error('Sync failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
