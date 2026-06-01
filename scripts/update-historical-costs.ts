import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== UPDATING HISTORICAL ORDER ITEM COSTS BY ID ===');

  // Update Tissot PRX Powermatic Black Dial (W0007):
  // - First time (Order #A003, ID: 769c8744-9cf6-44d8-8f5c-013ac88ab0ef): EGP 185
  // - Second time (Order #A028, ID: 8ae46b1a-8153-4b92-a124-2cdf17b87758): EGP 200
  await prisma.orderItem.update({
    where: { id: '769c8744-9cf6-44d8-8f5c-013ac88ab0ef' },
    data: { costAtPurchase: 185 }
  });
  console.log('Updated Tissot in Order #A003 to EGP 185');

  await prisma.orderItem.update({
    where: { id: '8ae46b1a-8153-4b92-a124-2cdf17b87758' },
    data: { costAtPurchase: 200 }
  });
  console.log('Updated Tissot in Order #A028 to EGP 200');

  // Update Rolex Sky Dweller Green&Gold (W0011):
  // - First time (Order #A002, ID: e2e4c9f7-9ef0-46df-93fa-3c30fdda4a37): EGP 375
  // - Second time (Order #A010, ID: 6067b778-4642-4bac-9164-e0ab97458324): EGP 350
  await prisma.orderItem.update({
    where: { id: 'e2e4c9f7-9ef0-46df-93fa-3c30fdda4a37' },
    data: { costAtPurchase: 375 }
  });
  console.log('Updated Rolex in Order #A002 to EGP 375');

  await prisma.orderItem.update({
    where: { id: '6067b778-4642-4bac-9164-e0ab97458324' },
    data: { costAtPurchase: 350 }
  });
  console.log('Updated Rolex in Order #A010 to EGP 350');

  // Update Rolex Land Dweller Tiffany Dial (W0038):
  // - 2 pieces bought at 450 (Order #A019 & Order #A020)
  // - 5 pieces bought at 400 (remaining 2 sold in Order #A029 & #A030, and 3 in stock)
  await prisma.orderItem.update({
    where: { id: '35c98f87-cd0a-448d-a2d8-ab5f28a06547' },
    data: { costAtPurchase: 450 }
  });
  console.log('Updated Tiffany Dial in Order #A019 to EGP 450');

  await prisma.orderItem.update({
    where: { id: '0a6db9b1-6e72-45f1-963e-04934d7ad56f' },
    data: { costAtPurchase: 450 }
  });
  console.log('Updated Tiffany Dial in Order #A020 to EGP 450');

  await prisma.orderItem.update({
    where: { id: '7d05e609-5776-45af-a990-87b7748076f5' },
    data: { costAtPurchase: 400 }
  });
  console.log('Updated Tiffany Dial in Order #A029 to EGP 400');

  await prisma.orderItem.update({
    where: { id: '65a4a509-4343-4991-bc49-2f608f68a123' },
    data: { costAtPurchase: 400 }
  });
  console.log('Updated Tiffany Dial in Order #A030 to EGP 400');

  // Update the product specs for W0038 to supplierPrice = 400 (so available stock has cost EGP 400)
  const tiffanyProduct = await prisma.product.findFirst({
    where: {
      variants: { some: { sku: 'W0038' } }
    }
  });
  if (tiffanyProduct && tiffanyProduct.specs && typeof tiffanyProduct.specs === 'object') {
    const updatedSpecs = { ...(tiffanyProduct.specs as object), supplierPrice: 400 };
    await prisma.product.update({
      where: { id: tiffanyProduct.id },
      data: { specs: updatedSpecs }
    });
    console.log('Updated Tiffany Dial product specs supplierPrice to EGP 400');
  }

  // Also update variant costPrice to 500 (since supplierPrice 400 + 100 additional costs = 500)
  await prisma.variant.updateMany({
    where: { sku: 'W0038' },
    data: { costPrice: 500 }
  });
  console.log('Updated Tiffany Dial variant costPrice to EGP 500');

  // 2. Fallback update for all other audited order items with null or zero costAtPurchase
  console.log('\nUpdating other null/zero cost items using specs or current price...');

  const nullCostItems = await prisma.orderItem.findMany({
    where: {
      order: { isFinanciallyAudited: true },
      OR: [
        { costAtPurchase: null },
        { costAtPurchase: 0 }
      ]
    },
    include: {
      product: true,
      variant: true,
      order: true
    }
  });

  console.log(`Found ${nullCostItems.length} other items requiring cost data updates.`);

  for (const item of nullCostItems) {
    // Skip the ones we manually updated
    if ([
      '769c8744-9cf6-44d8-8f5c-013ac88ab0ef', 
      '8ae46b1a-8153-4b92-a124-2cdf17b87758', 
      'e2e4c9f7-9ef0-46df-93fa-3c30fdda4a37', 
      '6067b778-4642-4bac-9164-e0ab97458324',
      '35c98f87-cd0a-448d-a2d8-ab5f28a06547', 
      '0a6db9b1-6e72-45f1-963e-04934d7ad56f', 
      '7d05e609-5776-45af-a990-87b7748076f5', 
      '65a4a509-4343-4991-bc49-2f608f68a123'
    ].includes(item.id)) continue;

    let defaultWholesale = 0;

    // A. Specs supplierPrice
    if (item.product?.specs && typeof item.product.specs === 'object') {
      const specs = item.product.specs as Record<string, unknown>;
      if (specs['supplierPrice'] !== undefined) {
        defaultWholesale = Number(specs['supplierPrice']);
      }
    }

    // B. Fallback to product/variant cost price
    if (defaultWholesale === 0) {
      const systemCost = item.variant?.costPrice 
        ? item.variant.costPrice.toNumber() 
        : (item.product?.costPrice ? item.product.costPrice.toNumber() : 0);
      defaultWholesale = systemCost > 100 ? systemCost - 100 : systemCost;
    }

    if (defaultWholesale > 0) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { costAtPurchase: defaultWholesale }
      });
      console.log(`Updated ${item.name} in Order #${item.order.orderNumber} to default wholesale EGP ${defaultWholesale}`);
    }
  }

  console.log('\nUpdates complete. Fetching updated sold report...');

  // ==========================================
  // Fetch and print final sold report
  // ==========================================
  const allSoldItems = await prisma.orderItem.findMany({
    where: {
      order: { status: 'delivered' }
    },
    include: {
      product: true,
      variant: true
    }
  });

  interface SoldGroup {
    name: string;
    sku: string;
    wholesaleCost: number;
    quantitySold: number;
  }

  const soldMap = new Map<string, SoldGroup>();

  for (const item of allSoldItems) {
    const wholesaleCost = item.costAtPurchase ? item.costAtPurchase.toNumber() : 0;
    const key = `${item.productId}_${item.variantId || 'no-variant'}_${wholesaleCost}`;
    const existing = soldMap.get(key);
    
    if (existing) {
      existing.quantitySold += item.quantity;
    } else {
      soldMap.set(key, {
        name: item.product?.name || item.name,
        sku: item.sku || item.variant?.sku || 'N/A',
        wholesaleCost,
        quantitySold: item.quantity
      });
    }
  }

  const soldReport = Array.from(soldMap.values()).sort((a, b) => {
    if (a.name !== b.name) return a.name.localeCompare(b.name);
    return b.wholesaleCost - a.wholesaleCost;
  });

  console.log('\n=========================================');
  console.log('RE-GENERATED SOLD & AUDITED PRODUCTS REPORT');
  console.log('=========================================');
  for (const item of soldReport) {
    console.log(`| ${item.name} | ${item.sku} | EGP ${item.wholesaleCost} | ${item.quantitySold} |`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
