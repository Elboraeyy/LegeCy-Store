import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const variant = await prisma.variant.findFirst({
    where: { sku: 'W0038' },
    include: {
      product: true,
      inventory: true
    }
  });

  if (!variant) {
    console.log('Variant W0038 not found.');
    return;
  }

  console.log('=== VARIANT INFO ===');
  console.log('ID:', variant.id);
  console.log('SKU:', variant.sku);
  console.log('costPrice:', variant.costPrice?.toNumber());
  console.log('price:', variant.price.toNumber());
  console.log('=== PRODUCT INFO ===');
  console.log('ID:', variant.product.id);
  console.log('Name:', variant.product.name);
  console.log('Specs:', JSON.stringify(variant.product.specs, null, 2));
  console.log('costPrice:', variant.product.costPrice?.toNumber());
  console.log('=== INVENTORY INFO ===');
  for (const inv of variant.inventory) {
    console.log(`- Warehouse ${inv.warehouseId}: available=${inv.available}, reserved=${inv.reserved}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
