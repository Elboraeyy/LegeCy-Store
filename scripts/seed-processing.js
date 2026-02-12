
/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding "processing" to OrderStatusEnum...');
  
  const exists = await prisma.orderStatusEnum.findUnique({
    where: { value: 'processing' }
  });

  if (!exists) {
    await prisma.orderStatusEnum.create({
      data: { value: 'processing' }
    });
    console.log('+ Added status: processing');
  } else {
    console.log('= Status "processing" already exists.');
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
