

/**
 * Inventory Valuation Service
 * 
 * Treats inventory as a FINANCIAL ASSET, not just physical stock.
 * Provides multiple valuation methods for accounting and decision-making.
 * 
 * Valuation Methods:
 * - At Cost: Total (units × cost price) - Most conservative
 * - At Sale: Total (units × selling price) - Potential revenue
 * - At Liquidation: Total (units × 70% cost) - Worst-case
 * - FIFO/LIFO: Future implementation
 */

import prisma from '@/lib/prisma';



export interface InventoryValuation {
  atCost: number;
  atSale: number;
  atLiquidation: number;
  totalUnits: number;
  skuCount: number;
  breakdown: Array<{
    variantId: string;
    sku: string;
    productName: string;
    quantity: number;
    costPrice: number;
    salePrice: number;
    valueAtCost: number;
    valueAtSale: number;
    potentialProfit: number;
  }>;
}

export interface InventoryHealthMetrics {
  totalValue: number;
  slowMovingValue: number;
  fastMovingValue: number;
  deadStockValue: number;
  turnoverRate: number;
  averageDaysToSell: number;
}

/**
 * Get full inventory valuation with multiple methods
 */
export async function getInventoryValuation(): Promise<InventoryValuation> {
  // Get all inventory with variant and product info
  const inventory = await prisma.inventory.findMany({
    where: {
      available: { gt: 0 }
    },
    include: {
      variant: {
        include: {
          product: true
        }
      }
    }
  });

  let atCost = 0;
  let atSale = 0;
  let atLiquidation = 0;
  let totalUnits = 0;

  const breakdown = inventory.map(inv => {
    const costPrice = Number(inv.variant?.costPrice || 0);
    const salePrice = Number(inv.variant?.price || 0);
    const quantity = inv.available;
    
    const valueAtCost = costPrice * quantity;
    const valueAtSale = salePrice * quantity;
    const valueAtLiquidation = costPrice * 0.7 * quantity;
    
    atCost += valueAtCost;
    atSale += valueAtSale;
    atLiquidation += valueAtLiquidation;
    totalUnits += quantity;

    return {
      variantId: inv.variantId,
      sku: inv.variant?.sku || 'N/A',
      productName: inv.variant?.product?.name || 'Unknown',
      quantity,
      costPrice,
      salePrice,
      valueAtCost,
      valueAtSale,
      potentialProfit: valueAtSale - valueAtCost
    };
  });

  return {
    atCost,
    atSale,
    atLiquidation,
    totalUnits,
    skuCount: inventory.length,
    breakdown
  };
}

/**
 * Calculate inventory health metrics
 */
export async function getInventoryHealth(): Promise<InventoryHealthMetrics> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Get all inventory
  const inventory = await prisma.inventory.findMany({
    where: { available: { gt: 0 } },
    include: { variant: { include: { product: true } } }
  });

  // Get sales data for last 90 days
  const recentSales = await prisma.orderItem.groupBy({
    by: ['variantId'],
    where: {
      order: {
        status: { in: ['Paid', 'Shipped', 'Delivered'] },
        createdAt: { gte: ninetyDaysAgo }
      }
    },
    _sum: { quantity: true }
  });

  const salesMap = new Map(
    recentSales.map(s => [s.variantId, s._sum?.quantity || 0])
  );

  let totalValue = 0;
  let slowMovingValue = 0;
  let fastMovingValue = 0;
  let deadStockValue = 0;
  let totalSoldUnits = 0;
  let totalCurrentUnits = 0;

  inventory.forEach(inv => {
    const costPrice = Number(inv.variant?.costPrice || 0);
    const value = costPrice * inv.available;
    const soldQty = salesMap.get(inv.variantId) || 0;

    totalValue += value;
    totalCurrentUnits += inv.available;
    totalSoldUnits += soldQty;

    // Categorize stock
    if (soldQty === 0) {
      deadStockValue += value; // No sales in 90 days
    } else if (soldQty < inv.available * 0.1) {
      slowMovingValue += value; // Sold less than 10% of stock
    } else {
      fastMovingValue += value; // Good movement
    }
  });

  // Calculate turnover rate (units sold / average units)
  const turnoverRate = totalCurrentUnits > 0 
    ? (totalSoldUnits / totalCurrentUnits) * (365 / 90) // Annualized
    : 0;

  // Average days to sell
  const averageDaysToSell = turnoverRate > 0 
    ? 365 / turnoverRate 
    : 0;

  return {
    totalValue,
    slowMovingValue,
    fastMovingValue,
    deadStockValue,
    turnoverRate,
    averageDaysToSell
  };
}

/**
 * Get COGS for a specific order (calculation helper)
 */
export async function calculateOrderCOGS(orderId: string): Promise<number> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { variant: true }
      }
    }
  });

  if (!order) return 0;

  let cogs = 0;
  order.items.forEach(item => {
    const cost = Number(item.variant?.costPrice || 0);
    cogs += cost * item.quantity;
  });

  return cogs;
}

/**
 * Get inventory value for balance sheet
 */
export async function getInventoryForBalanceSheet() {
  const valuation = await getInventoryValuation();
  const health = await getInventoryHealth();

  return {
    // Use cost basis for balance sheet (conservative)
    bookValue: valuation.atCost,
    
    // Show other valuations for disclosure
    fairValue: valuation.atSale,
    liquidationValue: valuation.atLiquidation,
    
    // Physical counts
    totalUnits: valuation.totalUnits,
    totalSKUs: valuation.skuCount,
    
    // Health indicators
    deadStockRisk: health.deadStockValue,
    slowMovingRisk: health.slowMovingValue,
    turnoverDays: Math.round(health.averageDaysToSell)
  };
}


