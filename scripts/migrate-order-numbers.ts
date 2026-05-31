import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { generateNextOrderNumber } from '../src/lib/utils/orderNumberGenerator';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting order number conversion and data migration...');

  // 1. Manually alter the PostgreSQL column type to varchar(50) and drop default constraint (autoincrement)
  try {
    console.log('Altering column type of "orderNumber" in PostgreSQL to VARCHAR(50)...');
    
    // We execute raw SQL to alter the table structure.
    // Drop the default autoincrement sequence, and cast the column to varchar.
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Order" 
      ALTER COLUMN "orderNumber" DROP DEFAULT,
      ALTER COLUMN "orderNumber" TYPE varchar(50) USING "orderNumber"::varchar(50);
    `);
    
    console.log('PostgreSQL column altered successfully.');
  } catch (error) {
    console.warn('Altering column directly failed or already done. Error:', error);
  }

  // 2. Fetch all existing orders in chronological order (by original placement time or number)
  console.log('Fetching existing orders to re-number...');
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

  // 3. Sequentially calculate and update new order numbers
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

  console.log('Updating order numbers in the database...');
  // We use a transaction to ensure all orders are updated successfully
  await prisma.$transaction(async (tx) => {
    for (const update of updates) {
      await tx.order.update({
        where: { id: update.id },
        data: { orderNumber: update.newNum },
      });
      console.log(`Order ID ${update.id}: ${update.oldNum} -> ${update.newNum}`);
    }
  }, {
    timeout: 30000
  });

  console.log('Migration completed successfully.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
