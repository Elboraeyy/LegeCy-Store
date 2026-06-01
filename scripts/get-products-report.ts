import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CurrentProductReportItem {
  productId: string;
  nameEn: string;
  nameAr: string;
  sku: string;
  supplierPrice: number | null;
  additionalCosts: number | null;
  systemCostPrice: number | null;
  availableStock: number;
  reservedStock: number;
  totalStock: number;
}

interface SoldProductReportItem {
  productId: string;
  name: string;
  sku: string;
  wholesaleCost: number;
  quantitySold: number;
}

async function main() {
  console.log('Generating Products Purchase and Sales Report...');

  // ==========================================
  // Part 1: Current Products Report
  // ==========================================
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

  const currentProductsReport: CurrentProductReportItem[] = variants.map(v => {
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

    // Fallbacks
    const systemCostPrice = v.costPrice ? v.costPrice.toNumber() : null;
    const availableStock = v.inventory.reduce((sum, inv) => sum + inv.available, 0);
    const reservedStock = v.inventory.reduce((sum, inv) => sum + inv.reserved, 0);
    const totalStock = availableStock + reservedStock;

    return {
      productId: v.product.id,
      nameEn: v.product.name,
      nameAr: v.product.nameAr || '',
      sku: v.sku,
      supplierPrice,
      additionalCosts,
      systemCostPrice,
      availableStock,
      reservedStock,
      totalStock,
    };
  });

  // ==========================================
  // Part 2: Sold Products (Audited) Report
  // ==========================================
  const auditedOrderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        isFinanciallyAudited: true,
      },
      costAtPurchase: {
        not: null,
      }
    },
    include: {
      order: {
        select: {
          orderNumber: true,
          deliveredAt: true,
        }
      }
    }
  });

  // Aggregate audited items by Product/Variant/SKU and wholesale price
  const soldAggregationMap = new Map<string, SoldProductReportItem>();

  for (const item of auditedOrderItems) {
    const wholesaleCost = item.costAtPurchase ? item.costAtPurchase.toNumber() : 0;
    const key = `${item.productId}_${item.variantId || 'no-variant'}_${wholesaleCost}`;

    const existing = soldAggregationMap.get(key);
    if (existing) {
      existing.quantitySold += item.quantity;
    } else {
      soldAggregationMap.set(key, {
        productId: item.productId,
        name: item.name,
        sku: item.sku || 'N/A',
        wholesaleCost,
        quantitySold: item.quantity,
      });
    }
  }

  const soldProductsReport = Array.from(soldAggregationMap.values()).sort((a, b) => {
    if (a.name !== b.name) return a.name.localeCompare(b.name);
    return b.wholesaleCost - a.wholesaleCost;
  });

  // ==========================================
  // Print Reports as Markdown
  // ==========================================

  console.log('\n=========================================');
  console.log('1. CURRENT PRODUCTS & PURCHASE PRICES REPORT');
  console.log('=========================================');
  
  console.log('| Product Name (EN) | Product Name (AR) | SKU | Supplier Price (الجملة) | Additional Costs (الاضافات) | Total Cost in System | Available Stock | Reserved | Total Stock |');
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const item of currentProductsReport) {
    if (item.availableStock > 0) {
      console.log(`| ${item.nameEn} | ${item.nameAr} | ${item.sku} | EGP ${item.supplierPrice ?? 'N/A'} | EGP ${item.additionalCosts ?? 'N/A'} | EGP ${item.systemCostPrice ?? 'N/A'} | ${item.availableStock} | ${item.reservedStock} | ${item.totalStock} |`);
    }
  }

  console.log('\n=========================================');
  console.log('2. SOLD & AUDITED PRODUCTS REPORT');
  console.log('=========================================');
  console.log('| Product/Item Name | SKU | Audited Wholesale Price (سعر الجملة بدون إضافات) | Total Quantity Sold |');
  console.log('| --- | --- | --- | --- |');
  for (const item of soldProductsReport) {
    console.log(`| ${item.name} | ${item.sku} | EGP ${item.wholesaleCost} | ${item.quantitySold} |`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
