'use server';

import prisma from '@/lib/prisma';

/**
 * Order Risk Scoring Service
 * 
 * Calculates risk scores for orders to identify potential fraud or high-return risk.
 */

// ============================================
// Types
// ============================================

export type RiskFactors = {
  newCustomer: boolean;
  highReturnArea: boolean;
  cod: boolean;
  highValue: boolean;
  suspiciousEmail: boolean;
  multipleAddresses: boolean;
  rushOrder: boolean;
  previousReturns: boolean;
};

export type OrderRiskResult = {
  orderId: string;
  score: number;
  factors: RiskFactors;
  flagged: boolean;
  recommendation: 'approve' | 'review' | 'block';
};

// ============================================
// Risk Scoring Configuration
// ============================================

const RISK_WEIGHTS = {
  newCustomer: 15,        // First-time customer
  highReturnArea: 25,     // City with high return rate
  cod: 20,                // Cash on delivery
  highValue: 15,          // Order value above threshold
  suspiciousEmail: 10,    // Suspicious email pattern
  multipleAddresses: 10,  // Different shipping address than usual
  rushOrder: 5,           // Order placed at unusual hours
  previousReturns: 20,    // Customer has returned items before
};

const HIGH_VALUE_THRESHOLD = 2000; // EGP
const HIGH_RETURN_RATE_THRESHOLD = 20; // Percentage
const FLAG_THRESHOLD = 50; // Score above this is flagged

// ============================================
// Main Scoring Function
// ============================================

/**
 * Calculate risk score for an order
 */
export async function scoreOrder(orderId: string): Promise<OrderRiskResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: true
    }
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const factors: RiskFactors = {
    newCustomer: false,
    highReturnArea: false,
    cod: false,
    highValue: false,
    suspiciousEmail: false,
    multipleAddresses: false,
    rushOrder: false,
    previousReturns: false,
  };

  // 1. Check if new customer
  if (order.userId) {
    const previousOrders = await prisma.order.count({
      where: { 
        userId: order.userId,
        id: { not: orderId }
      }
    });
    factors.newCustomer = previousOrders === 0;
  } else {
    // Guest checkout - check by email
    const previousByEmail = await prisma.order.count({
      where: {
        customerEmail: order.customerEmail,
        id: { not: orderId }
      }
    });
    factors.newCustomer = previousByEmail === 0;
  }

  // 2. Check if shipping to high return area
  if (order.shippingCity) {
    const zone = await prisma.shippingZone.findFirst({
      where: {
        cities: { has: order.shippingCity }
      }
    });
    if (zone && Number(zone.returnRate) >= HIGH_RETURN_RATE_THRESHOLD) {
      factors.highReturnArea = true;
    }
  }

  // 3. Check payment method
  factors.cod = order.paymentMethod === 'cod';

  // 4. Check order value
  factors.highValue = Number(order.totalPrice) >= HIGH_VALUE_THRESHOLD;

  // 5. Check for suspicious email patterns
  if (order.customerEmail) {
    const email = order.customerEmail.toLowerCase();
    const suspiciousPatterns = [
      /\d{5,}@/,           // 5+ digits before @
      /test/i,             // Contains "test"
      /fake/i,             // Contains "fake"
      /@(temp|throwaway)/, // Temp email domains
    ];
    factors.suspiciousEmail = suspiciousPatterns.some(p => p.test(email));
  }

  // 6. Check for multiple addresses (for registered users)
  if (order.userId) {
    const addresses = await prisma.address.count({
      where: { userId: order.userId }
    });
    factors.multipleAddresses = addresses > 3;
  }

  // 7. Check for unusual order time (2am - 5am)
  const orderHour = order.createdAt.getHours();
  factors.rushOrder = orderHour >= 2 && orderHour <= 5;

  // 8. Check customer return history
  if (order.userId) {
    const returns = await prisma.returnRequest.count({
      where: {
        order: { userId: order.userId },
        status: { in: ['approved', 'completed'] }
      }
    });
    factors.previousReturns = returns >= 2;
  } else if (order.customerEmail) {
    const returns = await prisma.returnRequest.count({
      where: {
        order: { customerEmail: order.customerEmail },
        status: { in: ['approved', 'completed'] }
      }
    });
    factors.previousReturns = returns >= 2;
  }

  // Calculate total score
  let score = 0;
  if (factors.newCustomer) score += RISK_WEIGHTS.newCustomer;
  if (factors.highReturnArea) score += RISK_WEIGHTS.highReturnArea;
  if (factors.cod) score += RISK_WEIGHTS.cod;
  if (factors.highValue) score += RISK_WEIGHTS.highValue;
  if (factors.suspiciousEmail) score += RISK_WEIGHTS.suspiciousEmail;
  if (factors.multipleAddresses) score += RISK_WEIGHTS.multipleAddresses;
  if (factors.rushOrder) score += RISK_WEIGHTS.rushOrder;
  if (factors.previousReturns) score += RISK_WEIGHTS.previousReturns;

  const flagged = score >= FLAG_THRESHOLD;
  const recommendation = score < 30 ? 'approve' : score < 60 ? 'review' : 'block';

  // Save risk score to database
  await prisma.orderRiskScore.upsert({
    where: { orderId },
    create: {
      orderId,
      score,
      factors: factors as object,
      flagged,
      reviewStatus: flagged ? 'pending' : 'approved'
    },
    update: {
      score,
      factors: factors as object,
      flagged,
    }
  });

  return { orderId, score, factors, flagged, recommendation };
}

/**
 * Get all flagged orders pending review
 */
export async function getFlaggedOrders() {
  return await prisma.orderRiskScore.findMany({
    where: {
      flagged: true,
      reviewStatus: 'pending'
    },
    orderBy: { score: 'desc' }
  });
}

/**
 * Review a flagged order
 */
export async function reviewOrder(
  orderId: string, 
  adminId: string, 
  decision: 'approved' | 'blocked',
  note?: string
) {
  return await prisma.orderRiskScore.update({
    where: { orderId },
    data: {
      reviewStatus: decision,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewNote: note
    }
  });
}

// ============================================
// Returns Intelligence
// ============================================

export type ReturnStats = {
  totalReturns: number;
  returnRate: number;
  totalCost: number;
  topReasons: { reason: string; count: number }[];
  byProduct: {
    productId: string;
    productName: string;
    returnCount: number;
    returnRate: number;
    totalCost: number;
  }[];
  byRegion: {
    city: string;
    returnCount: number;
    returnRate: number;
  }[];
  suggestions: string[];
};

/**
 * Get comprehensive returns intelligence
 */
export async function getReturnsIntelligence(): Promise<ReturnStats> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get all returns
  const returns = await prisma.returnRequest.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo }
    },
    include: {
      order: {
        include: {
          items: true
        }
      }
    }
  });

  // Get total orders for rate calculation
  const totalOrders = await prisma.order.count({
    where: { createdAt: { gte: thirtyDaysAgo } }
  });

  const totalReturns = returns.length;
  const returnRate = totalOrders > 0 ? (totalReturns / totalOrders) * 100 : 0;

  // Calculate total cost of returns
  const totalCost = returns.reduce((sum, r) => sum + Number(r.order.totalPrice), 0);

  // Aggregate reasons
  const reasonCounts: Record<string, number> = {};
  returns.forEach(r => {
    const reason = r.reason || 'غير محدد';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  });

  const topReasons = Object.entries(reasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Aggregate by product
  const productCounts: Record<string, { name: string; returns: number; orders: number; cost: number }> = {};
  
  for (const ret of returns) {
    for (const item of ret.order.items) {
      if (!productCounts[item.productId]) {
        productCounts[item.productId] = { name: item.name, returns: 0, orders: 0, cost: 0 };
      }
      productCounts[item.productId].returns++;
      productCounts[item.productId].cost += Number(item.price) * item.quantity;
    }
  }

  // Get total orders per product for rate
  const productOrders = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: { createdAt: { gte: thirtyDaysAgo } }
    },
    _count: true
  });

  productOrders.forEach(po => {
    if (productCounts[po.productId]) {
      productCounts[po.productId].orders = po._count;
    }
  });

  const byProduct = Object.entries(productCounts)
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      returnCount: data.returns,
      returnRate: data.orders > 0 ? (data.returns / data.orders) * 100 : 0,
      totalCost: data.cost
    }))
    .sort((a, b) => b.returnCount - a.returnCount)
    .slice(0, 10);

  // Aggregate by region
  const regionCounts: Record<string, { returns: number; orders: number }> = {};
  
  returns.forEach(r => {
    const city = r.order.shippingCity || 'Unknown';
    if (!regionCounts[city]) {
      regionCounts[city] = { returns: 0, orders: 0 };
    }
    regionCounts[city].returns++;
  });

  // Get total orders per region
  const regionOrders = await prisma.order.groupBy({
    by: ['shippingCity'],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _count: true
  });

  regionOrders.forEach(ro => {
    const city = ro.shippingCity || 'Unknown';
    if (regionCounts[city]) {
      regionCounts[city].orders = ro._count;
    } else {
      regionCounts[city] = { returns: 0, orders: ro._count };
    }
  });

  const byRegion = Object.entries(regionCounts)
    .map(([city, data]) => ({
      city,
      returnCount: data.returns,
      returnRate: data.orders > 0 ? (data.returns / data.orders) * 100 : 0
    }))
    .sort((a, b) => b.returnRate - a.returnRate)
    .slice(0, 10);

  // Generate suggestions
  const suggestions: string[] = [];

  if (returnRate > 10) {
    suggestions.push('📈 نسبة المرتجعات أعلى من 10% - راجع جودة المنتجات وسياسة الشحن');
  }

  const highReturnProducts = byProduct.filter(p => p.returnRate > 15);
  if (highReturnProducts.length > 0) {
    suggestions.push(`⚠️ ${highReturnProducts.length} منتج بنسبة مرتجع أعلى من 15% - فكر في إيقافها أو تحسينها`);
  }

  const highReturnRegions = byRegion.filter(r => r.returnRate > 20);
  if (highReturnRegions.length > 0) {
    suggestions.push(`🗺️ مناطق عالية المرتجع: ${highReturnRegions.map(r => r.city).join(', ')}`);
  }

  const sizeIssues = topReasons.find(r => r.reason.includes('مقاس') || r.reason.includes('size'));
  if (sizeIssues && sizeIssues.count > 5) {
    suggestions.push('📏 مشاكل المقاسات متكررة - أضف جدول مقاسات تفصيلي للمنتجات');
  }

  return {
    totalReturns,
    returnRate,
    totalCost,
    topReasons,
    byProduct,
    byRegion,
    suggestions
  };
}

// ============================================
// Supplier Performance
// ============================================

export type SupplierScore = {
  supplierId: string;
  supplierName: string;
  qualityScore: number;
  complianceScore: number;
  deliveryScore: number;
  overallScore: number;
  totalOrders: number;
  totalIssues: number;
  recommendation: 'invest' | 'maintain' | 'review' | 'exit';
};

/**
 * Get supplier performance scorecards
 */
export async function getSupplierPerformance(): Promise<SupplierScore[]> {
  const suppliers = await prisma.supplier.findMany({
    include: {
      invoices: {
        where: { status: 'POSTED' }
      }
    }
  });

  const scorecards: SupplierScore[] = [];

  for (const supplier of suppliers) {
    // Get or create performance record
    let perf = await prisma.supplierPerformance.findUnique({
      where: { supplierId: supplier.id }
    });

    if (!perf) {
      // Create default performance record
      perf = await prisma.supplierPerformance.create({
        data: {
          supplierId: supplier.id,
          totalOrders: supplier.invoices.length
        }
      });
    }

    const deliveryScore = perf.totalOrders > 0 
      ? (perf.onTimeDelivery / perf.totalOrders) * 100 
      : 80;

    const overallScore = Math.round(
      (perf.qualityScore + perf.complianceScore + deliveryScore) / 3
    );

    let recommendation: 'invest' | 'maintain' | 'review' | 'exit' = 'maintain';
    if (overallScore >= 90) recommendation = 'invest';
    else if (overallScore >= 70) recommendation = 'maintain';
    else if (overallScore >= 50) recommendation = 'review';
    else recommendation = 'exit';

    scorecards.push({
      supplierId: supplier.id,
      supplierName: supplier.name,
      qualityScore: perf.qualityScore,
      complianceScore: perf.complianceScore,
      deliveryScore: Math.round(deliveryScore),
      overallScore,
      totalOrders: perf.totalOrders,
      totalIssues: perf.totalIssues,
      recommendation
    });
  }

  return scorecards.sort((a, b) => b.overallScore - a.overallScore);
}
