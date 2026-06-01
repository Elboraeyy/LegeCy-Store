import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProductPurchaseStats {
  productId: string;
  name: string;
  sku: string;
  supplierName: string;
  totalQuantity: number;
  averageWholesalePrice: number;
  totalCost: number;
}

interface SupplierStats {
  name: string;
  totalQuantity: number;
  totalCost: number;
}

async function main() {
  console.log('=== GENERATING SMART FINANCIAL REPORT ===');

  // 1. Fetch all suppliers to map them
  const suppliers = await prisma.supplier.findMany();
  const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));
  console.log(`Loaded ${suppliers.length} suppliers from database.`);

  // 2. Fetch all products and their variants
  const variants = await prisma.variant.findMany({
    include: {
      product: {
        include: {
          supplier: true
        }
      },
      inventory: true
    }
  });

  // 3. Fetch all delivered order items
  const soldItems = await prisma.orderItem.findMany({
    where: {
      order: { status: 'delivered' }
    }
  });

  // Map of variantId -> list of sold items
  const soldItemsMap = new Map<string, typeof soldItems>();
  for (const item of soldItems) {
    if (item.variantId) {
      const list = soldItemsMap.get(item.variantId) || [];
      list.push(item);
      soldItemsMap.set(item.variantId, list);
    }
  }

  const productStatsList: ProductPurchaseStats[] = [];

  for (const v of variants) {
    const p = v.product;
    
    // Get default supplier price from specs
    let defaultSupplierPrice = 0;
    if (p.specs && typeof p.specs === 'object') {
      const specs = p.specs as any;
      if (specs.supplierPrice !== undefined) {
        defaultSupplierPrice = Number(specs.supplierPrice);
      }
    }

    // Fallbacks
    if (defaultSupplierPrice === 0) {
      const systemCost = v.costPrice ? v.costPrice.toNumber() : (p.costPrice ? p.costPrice.toNumber() : 0);
      defaultSupplierPrice = systemCost > 100 ? systemCost - 100 : systemCost;
    }

    // Get current available stock (reserved is reconciled to 0, so available is the stock)
    const availableStock = v.inventory.reduce((sum, inv) => sum + inv.available, 0);

    // Get sold occurrences
    const itemSales = soldItemsMap.get(v.id) || [];

    // Compile batches: quantity and price
    const batches: { qty: number; price: number }[] = [];

    // Batch A: Current Available Stock (purchased at current supplier price)
    if (availableStock > 0) {
      batches.push({ qty: availableStock, price: defaultSupplierPrice });
    }

    // Batch B: Sold Items (purchased at costAtPurchase)
    for (const sale of itemSales) {
      const saleCost = sale.costAtPurchase ? sale.costAtPurchase.toNumber() : defaultSupplierPrice;
      batches.push({ qty: sale.quantity, price: saleCost });
    }

    // Calculate totals
    const totalQuantity = batches.reduce((sum, b) => sum + b.qty, 0);
    const totalCost = batches.reduce((sum, b) => sum + (b.qty * b.price), 0);
    const averageWholesalePrice = totalQuantity > 0 ? totalCost / totalQuantity : defaultSupplierPrice;

    // Supplier Name
    const supplierName = p.supplier?.name || supplierMap.get(p.supplierId || '') || 'Main Supplier';

    productStatsList.push({
      productId: p.id,
      name: p.name,
      sku: v.sku,
      supplierName,
      totalQuantity,
      averageWholesalePrice,
      totalCost
    });
  }

  // Filter out products with 0 total quantity (i.e. not sold and not in stock) to keep report clean
  const activeProducts = productStatsList.filter(p => p.totalQuantity > 0).sort((a, b) => a.name.localeCompare(b.name));

  // ==========================================
  // Part 2: Aggregate by Supplier
  // ==========================================
  const supplierStatsMap = new Map<string, SupplierStats>();
  
  for (const p of activeProducts) {
    const existing = supplierStatsMap.get(p.supplierName);
    if (existing) {
      existing.totalQuantity += p.totalQuantity;
      existing.totalCost += p.totalCost;
    } else {
      supplierStatsMap.set(p.supplierName, {
        name: p.supplierName,
        totalQuantity: p.totalQuantity,
        totalCost: p.totalCost
      });
    }
  }

  const supplierStatsList = Array.from(supplierStatsMap.values()).sort((a, b) => b.totalCost - a.totalCost);

  // ==========================================
  // Part 3: Grand Totals
  // ==========================================
  const grandTotalQuantity = activeProducts.reduce((sum, p) => sum + p.totalQuantity, 0);
  const grandTotalCost = activeProducts.reduce((sum, p) => sum + p.totalCost, 0);

  // Print Tables
  console.log('\n==================================================================');
  console.log('TABLE 1: ALL PRODUCTS PURCHASED & AVERAGE COST');
  console.log('==================================================================');
  console.log('| Product Name | SKU | Supplier | Total Quantity Purchased | Unified Wholesale Price | Total Purchase Cost |');
  console.log('| --- | --- | --- | --- | --- | --- |');
  for (const item of activeProducts) {
    console.log(`| ${item.name} | ${item.sku} | ${item.supplierName} | ${item.totalQuantity} | EGP ${item.averageWholesalePrice.toFixed(2)} | EGP ${item.totalCost.toFixed(2)} |`);
  }

  console.log('\n==================================================================');
  console.log('TABLE 2: SUPPLIERS COMPARISON');
  console.log('==================================================================');
  console.log('| Supplier Name | Total Watches Purchased | Total Purchase Cost |');
  console.log('| --- | --- | --- |');
  for (const item of supplierStatsList) {
    console.log(`| ${item.name} | ${item.totalQuantity} | EGP ${item.totalCost.toFixed(2)} |`);
  }

  console.log('\n==================================================================');
  console.log('TABLE 3: GRAND SUMMARY');
  console.log('==================================================================');
  console.log(`Total Watches Purchased: ${grandTotalQuantity}`);
  console.log(`Total Purchase Cost: EGP ${grandTotalCost.toFixed(2)}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
