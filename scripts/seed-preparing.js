
/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding "preparing" to OrderStatusEnum...');
  
  const exists = await prisma.orderStatusEnum.findUnique({
    where: { value: 'preparing' }
  });

  if (!exists) {
    await prisma.orderStatusEnum.create({
      data: { value: 'preparing' }
    });
    console.log('+ Added status: preparing');
  } else {
    console.log('= Status "preparing" already exists.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
