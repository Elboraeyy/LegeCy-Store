
/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const STATUSES = [
  'pending',
  'payment_pending',
  'confirmed',
  'paid',
  'preparing',
  'shipped',
  'delivered',
  'cash_received',
  'cancelled',
  'refunded',
  'returned',
  'payment_failed',
  'processing' // Just in case
];

async function main() {
  console.log('Seeding OrderStatusEnum...');

  for (const status of STATUSES) {
    const exists = await prisma.orderStatusEnum.findUnique({
      where: { value: status }
    });

    if (!exists) {
      await prisma.orderStatusEnum.create({
        data: { value: status }
      });
      console.log(`+ Added status: ${status}`);
    } else {
      console.log(`= Exists: ${status}`);
    }
  }

  console.log('Done.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
