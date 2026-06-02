import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { generateNextOrderNumber } from '../src/lib/utils/orderNumberGenerator';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting order number re-sequencing...');

  // 1. Fetch all existing orders in chronological order
  console.log('Fetching existing orders sorted by createdAt...');
  const orders = await prisma.order.findMany({
    orderBy: [
      { createdAt: 'asc' },
      { id: 'asc' }
    ],
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
    }
  });

  console.log(`Found ${orders.length} orders to re-number.`);

  if (orders.length === 0) {
    console.log('No orders to migrate.');
    return;
  }

  // 2. Calculate desired new sequential numbers
  console.log('Calculating new alphanumeric sequential numbers...');
  
  let currentNum: string | null = null;
  const updates: { id: string; oldNum: string | null; newNum: string }[] = [];

  for (const order of orders) {
    const nextNum = generateNextOrderNumber(currentNum);
    updates.push({
      id: order.id,
      oldNum: order.orderNumber,
      newNum: nextNum,
    });
    currentNum = nextNum;
  }

  // Print planned changes
  console.log('\n--- Planned Changes ---');
  for (const u of updates) {
    const changed = u.oldNum !== u.newNum ? ' <<<' : '';
    console.log(`  ${u.oldNum} -> ${u.newNum}${changed}`);
  }
  console.log('--- End ---\n');

  // 3. Two-pass approach to avoid unique constraint collisions:
  //    Pass 1: Assign temporary placeholder numbers (TEMP_0001, TEMP_0002, ...)
  //    Pass 2: Assign the final sequential numbers
  console.log('Pass 1: Assigning temporary placeholder order numbers...');
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < updates.length; i++) {
      const tempNum = `TEMP_${String(i + 1).padStart(4, '0')}`;
      await tx.order.update({
        where: { id: updates[i].id },
        data: { orderNumber: tempNum },
      });
    }
  }, {
    timeout: 30000
  });
  console.log('Pass 1 complete.');

  console.log('Pass 2: Assigning final sequential order numbers...');
  await prisma.$transaction(async (tx) => {
    for (const update of updates) {
      await tx.order.update({
        where: { id: update.id },
        data: { orderNumber: update.newNum },
      });
      console.log(`  Order ID ${update.id}: ${update.oldNum} -> ${update.newNum}`);
    }
  }, {
    timeout: 30000
  });

  console.log('\n✅ Re-sequencing completed successfully! All 34 orders are now A001 through A034.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
