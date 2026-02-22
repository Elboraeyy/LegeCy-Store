
import prisma from '../lib/prisma';

async function main() {
  const variantId = 'e79e559e-c35f-4632-a7bb-1a5012fc53e9'; // Tank Noir Classic Edition (W0006)
  
  try {
    // 1. Find existing inventory records
    const inventories = await prisma.inventory.findMany({
      where: { variantId },
      include: { warehouse: true }
    });

    if (inventories.length === 0) {
      console.log('No inventory found for this variant. Cannot restock.');
      return;
    }

    console.log('Current Inventory:', JSON.stringify(inventories, null, 2));

    // 2. Choose warehouse (Prefer MAIN, or fallback to first found)
    const targetInventory = inventories.find(inv => inv.warehouse.type === 'MAIN') || inventories[0];
    const warehouseId = targetInventory.warehouseId;

    console.log(`Restocking 1 unit to warehouse: ${targetInventory.warehouse.name} (${warehouseId})`);

    // 3. Update (Increase Available)
    const updated = await prisma.inventory.update({
      where: { id: targetInventory.id },
      data: {
        available: { increment: 1 }
      }
    });

    console.log('Update Success:', JSON.stringify(updated, null, 2));

    // 4. Log the manual correction
    await prisma.inventoryLog.create({
      data: {
        warehouseId,
        variantId,
        action: 'STOCK_ADJUSTMENT',
        quantity: 1,
        reason: 'Manual correction for Order #20 (Waitlist item removal)',
        adminId: 'system-fix-script'
      }
    });
    console.log('Log entry created.');

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
