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

async function main() {
  console.log('=== GENERATING DETAILED SUPPLIER PROCUREMENT REPORT ===');

  // 1. Fetch all suppliers to map them
  const suppliers = await prisma.supplier.findMany();
  const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));

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
      const specs = p.specs as Record<string, unknown>;
      if (specs['supplierPrice'] !== undefined) {
        defaultSupplierPrice = Number(specs['supplierPrice']);
      }
    }

    // Fallbacks
    if (defaultSupplierPrice === 0) {
      const systemCost = v.costPrice ? v.costPrice.toNumber() : (p.costPrice ? p.costPrice.toNumber() : 0);
      defaultSupplierPrice = systemCost > 100 ? systemCost - 100 : systemCost;
    }

    // Get current available stock
    const availableStock = v.inventory.reduce((sum, inv) => sum + inv.available, 0);

    // Get sold occurrences
    const itemSales = soldItemsMap.get(v.id) || [];

    // Compile batches
    const batches: { qty: number; price: number }[] = [];

    if (availableStock > 0) {
      batches.push({ qty: availableStock, price: defaultSupplierPrice });
    }

    for (const sale of itemSales) {
      const saleCost = sale.costAtPurchase ? sale.costAtPurchase.toNumber() : defaultSupplierPrice;
      batches.push({ qty: sale.quantity, price: saleCost });
    }

    const totalQuantity = batches.reduce((sum, b) => sum + b.qty, 0);
    const totalCost = batches.reduce((sum, b) => sum + (b.qty * b.price), 0);
    const averageWholesalePrice = totalQuantity > 0 ? totalCost / totalQuantity : defaultSupplierPrice;

    const supplierName = p.supplier?.name || supplierMap.get(p.supplierId || '') || 'Main Supplier';

    if (totalQuantity > 0) {
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
  }

  // Sort active products by name
  productStatsList.sort((a, b) => a.name.localeCompare(b.name));

  // Group products by supplier name
  const supplierGroups = new Map<string, ProductPurchaseStats[]>();
  for (const item of productStatsList) {
    const list = supplierGroups.get(item.supplierName) || [];
    list.push(item);
    supplierGroups.set(item.supplierName, list);
  }

  // Print separate tables for each supplier
  const sortedSuppliers = Array.from(supplierGroups.keys()).sort();

  for (const supplierName of sortedSuppliers) {
    const groupItems = supplierGroups.get(supplierName) || [];
    const totalGroupQty = groupItems.reduce((sum, i) => sum + i.totalQuantity, 0);
    const totalGroupCost = groupItems.reduce((sum, i) => sum + i.totalCost, 0);

    console.log(`\n=========================================`);
    console.log(`SUPPLIER: ${supplierName.toUpperCase()}`);
    console.log(`=========================================`);
    console.log(`Total Watches: ${totalGroupQty} | Total Cost: EGP ${totalGroupCost.toFixed(2)}`);
    console.log(`\n| Product Name | SKU | Unit Cost (Averaged) | Quantity Purchased | Total Purchase Cost |`);
    console.log(`| --- | --- | --- | --- | --- |`);
    
    for (const item of groupItems) {
      console.log(`| ${item.name} | ${item.sku} | EGP ${item.averageWholesalePrice.toFixed(2)} | ${item.totalQuantity} | EGP ${item.totalCost.toFixed(2)} |`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
