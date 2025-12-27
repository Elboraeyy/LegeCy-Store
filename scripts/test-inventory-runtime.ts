
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Verifying Inventory Schema Runtime ---');

  // 1. Check if we can access InventoryLog model
  if (!prisma.inventoryLog) {
    console.error('❌ Error: prisma.inventoryLog is undefined!');
    process.exit(1);
  }
  console.log('✅ prisma.inventoryLog exists.');

  // 2. Check if we can write minStock
  // Find a test variant or create one
  const warehouse = await prisma.warehouse.findFirst();
  const variant = await prisma.variant.findFirst();

  if (!warehouse || !variant) {
    console.log('⚠️ Warning: No warehouse or variant found to test data write. Skipping data test.');
    return;
  }

  console.log(`Testing with Warehouse: ${warehouse.name}, Variant: ${variant.sku}`);

  // Upsert Inventory
  const inv = await prisma.inventory.upsert({
    where: { warehouseId_variantId: { warehouseId: warehouse.id, variantId: variant.id } },
    update: { minStock: 10 }, 
    create: { 
        warehouseId: warehouse.id, 
        variantId: variant.id, 
        minStock: 10,
        available: 100 
    }
  });

  if (inv.minStock === 10) {
      console.log('✅ Successfully wrote and read `minStock`.');
  } else {
      console.error('❌ Failed to write minStock.');
  }

  // 3. Test creating a Log
  const log = await prisma.inventoryLog.create({
      data: {
          warehouseId: warehouse.id,
          variantId: variant.id,
          action: 'TEST_LOG',
          quantity: 0,
          balanceAfter: inv.available,
          reason: 'Automated Test'
      }
  });

  if (log && log.action === 'TEST_LOG') {
      console.log('✅ Successfully created InventoryLog entry.');
  }

  // Clean up test log
  await prisma.inventoryLog.delete({ where: { id: log.id } });
  console.log('✅ Cleaned up test log.');

  console.log('--- Verification Complete ---');
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
