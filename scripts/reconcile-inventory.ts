import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== INVENTORY RECONCILIATION & REPORT GENERATION ===');

  // 1. Audit and Correct Reserved Stock
  console.log('\nStep 1: Reconciling Reserved Stock in Database...');
  
  // Find all active orders that should reserve stock (status not in delivered, cancelled, refunded, draft)
  const activeOrders = await prisma.order.findMany({
    where: {
      status: {
        in: ['pending', 'payment_pending', 'shipped', 'confirmed']
      }
    },
    include: {
      items: true
    }
  });

  console.log(`Found ${activeOrders.length} active orders reserving stock.`);

  // Create a map of active reservations: variantId -> reservedQty
  const activeReservations = new Map<string, number>();
  for (const order of activeOrders) {
    for (const item of order.items) {
      if (item.variantId) {
        const qty = item.quantity;
        activeReservations.set(item.variantId, (activeReservations.get(item.variantId) || 0) + qty);
      }
    }
  }

  // Fetch all inventory records
  const inventories = await prisma.inventory.findMany({
    include: {
      variant: true
    }
  });

  console.log(`Auditing ${inventories.length} inventory records...`);
  let fixedCount = 0;

  for (const inv of inventories) {
    const correctReserved = activeReservations.get(inv.variantId) || 0;
    if (inv.reserved !== correctReserved) {
      await prisma.inventory.update({
        where: { id: inv.id },
        data: { reserved: correctReserved }
      });
      // console.log(`  - Fixed SKU ${inv.variant.sku}: reserved ${inv.reserved} -> ${correctReserved}`);
      fixedCount++;
    }
  }

  console.log(`Reconciliation complete. Fixed ${fixedCount} inventory records.`);

  // ==========================================
  // Part 2: Generate Current Products Report
  // ==========================================
  console.log('\nStep 2: Generating Current Products Report...');
  const variants = await prisma.variant.findMany({
    include: {
      product: true,
      inventory: true,
    },
    orderBy: [
      { product: { name: 'asc' } },
      { sku: 'asc' }
    ]
  });

  console.log('\n=========================================');
  console.log('1. CURRENT PRODUCTS & PURCHASE PRICES REPORT');
  console.log('=========================================');
  console.log('| Product Name (EN) | SKU | Supplier Price (الجملة) | Additional Costs (الاضافات) | Total Cost in System | Available Stock | Reserved | Total Stock |');
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- |');

  for (const v of variants) {
    let supplierPrice: number | null = null;
    let additionalCosts: number | null = null;

    if (v.product.specs && typeof v.product.specs === 'object') {
      const specs = v.product.specs as any;
      if (specs.supplierPrice !== undefined) {
        supplierPrice = Number(specs.supplierPrice);
      }
      if (specs.additionalCosts !== undefined) {
        additionalCosts = Number(specs.additionalCosts);
      }
    }

    const systemCostPrice = v.costPrice ? v.costPrice.toNumber() : null;
    const availableStock = v.inventory.reduce((sum, inv) => sum + inv.available, 0);
    const reservedStock = v.inventory.reduce((sum, inv) => sum + inv.reserved, 0);
    const totalStock = availableStock + reservedStock;

    // Output all products (we will filter for available-only in final display if requested, but let's show all in debug first)
    console.log(`| ${v.product.name} | ${v.sku} | EGP ${supplierPrice ?? 'N/A'} | EGP ${additionalCosts ?? 'N/A'} | EGP ${systemCostPrice ?? 'N/A'} | ${availableStock} | ${reservedStock} | ${totalStock} |`);
  }

  // ==========================================
  // Part 3: Generate Sold Products (Audited) Report with Fallbacks
  // ==========================================
  console.log('\nStep 3: Generating Sold Products Report...');
  
  // Fetch all order items from delivered/audited orders
  const soldItems = await prisma.orderItem.findMany({
    where: {
      order: {
        status: 'delivered'
      }
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

  for (const item of soldItems) {
    // Determine the wholesale price (supplierPrice) for this sale
    let wholesaleCost = 0;

    // 1. If explicit costAtPurchase is recorded and > 0, use it
    if (item.costAtPurchase && item.costAtPurchase.toNumber() > 0) {
      wholesaleCost = item.costAtPurchase.toNumber();
    } else {
      // 2. Fallback to product specs supplierPrice
      let supplierPrice = 0;
      if (item.product?.specs && typeof item.product.specs === 'object') {
        const specs = item.product.specs as any;
        if (specs.supplierPrice !== undefined) {
          supplierPrice = Number(specs.supplierPrice);
        }
      }

      if (supplierPrice > 0) {
        wholesaleCost = supplierPrice;
      } else {
        // 3. Fallback to product/variant costPrice in system (subtracting 100 additionalCosts if it looks like totalCost)
        const systemCost = item.variant?.costPrice 
          ? item.variant.costPrice.toNumber() 
          : (item.product?.costPrice ? item.product.costPrice.toNumber() : 0);
        
        // If systemCost is e.g. 500 and we know additional costs is 100, we fallback to 400
        wholesaleCost = systemCost > 100 ? systemCost - 100 : systemCost;
      }
    }

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
  console.log('2. SOLD & AUDITED PRODUCTS REPORT');
  console.log('=========================================');
  console.log('| Product/Item Name | SKU | Audited Wholesale Price (سعر الجملة بدون إضافات) | Total Quantity Sold |');
  console.log('| --- | --- | --- | --- |');
  for (const item of soldReport) {
    console.log(`| ${item.name} | ${item.sku} | EGP ${item.wholesaleCost} | ${item.quantitySold} |`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
