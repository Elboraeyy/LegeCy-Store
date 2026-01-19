'use server';

/**
 * Fraud Detection Service
 * 
 * Analyzes orders for potential fraud and calculates risk scores.
 * Can block or flag high-risk orders for manual review.
 */

import prisma from '@/lib/prisma';

// Risk factors and their weights
const RISK_FACTORS = {
  // Order-based factors
  HIGH_ORDER_VALUE: { threshold: 5000, weight: 15 },
  VERY_HIGH_ORDER_VALUE: { threshold: 10000, weight: 30 },
  MULTIPLE_SAME_ITEMS: { threshold: 5, weight: 10 },
  FIRST_ORDER: { weight: 5 },

  // Customer-based factors
  NEW_EMAIL_DOMAIN: { weight: 10 }, // Temporary email domains
  PREVIOUS_FRAUD_FLAG: { weight: 50 },
  MULTIPLE_FAILED_PAYMENTS: { threshold: 3, weight: 25 },

  // Address-based factors
  BLACKLISTED_AREA: { weight: 40 },
  ADDRESS_MISMATCH: { weight: 20 },

  // Pattern-based factors
  VELOCITY_SPIKE: { threshold: 3, weight: 25 }, // Multiple orders in short time
  INTERNATIONAL_IP: { weight: 15 },
} as const;

// Temporary email domains to flag
const SUSPICIOUS_EMAIL_DOMAINS = [
  'tempmail.com', 'throwaway.email', '10minutemail.com',
  'guerrillamail.com', 'mailinator.com', 'yopmail.com',
  'temp-mail.org', 'getnada.com'
];

// Blacklisted areas (example)
const BLACKLISTED_AREAS: string[] = [
  // Add any known problematic areas
];

export interface FraudCheckResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  shouldBlock: boolean;
  shouldReview: boolean;
  factors: Array<{
    factor: string;
    score: number;
    details: string;
  }>;
}

/**
 * Analyze an order for fraud risk
 */
export interface FraudInput {
  totalAmount: number;
  items: Array<{ name: string; quantity: number }>;
  customerEmail: string;
  userId?: string | null;
  shippingCity?: string;
  ipAddress?: string;
}

/**
 * Score a potential order based on input data
 */
export async function analyzeRisk(input: FraudInput): Promise<FraudCheckResult> {
  const factors: FraudCheckResult['factors'] = [];
  let totalScore = 0;

  // 1. Check order value
  const orderValue = input.totalAmount;
  if (orderValue >= RISK_FACTORS.VERY_HIGH_ORDER_VALUE.threshold) {
    const score = RISK_FACTORS.VERY_HIGH_ORDER_VALUE.weight;
    factors.push({
      factor: 'VERY_HIGH_ORDER_VALUE',
      score,
      details: `Order value ${orderValue} EGP exceeds ${RISK_FACTORS.VERY_HIGH_ORDER_VALUE.threshold} EGP`
    });
    totalScore += score;
  } else if (orderValue >= RISK_FACTORS.HIGH_ORDER_VALUE.threshold) {
    const score = RISK_FACTORS.HIGH_ORDER_VALUE.weight;
    factors.push({
      factor: 'HIGH_ORDER_VALUE',
      score,
      details: `Order value ${orderValue} EGP exceeds ${RISK_FACTORS.HIGH_ORDER_VALUE.threshold} EGP`
    });
    totalScore += score;
  }

  // 2. Check for bulk same items
  for (const item of input.items) {
    if (item.quantity >= RISK_FACTORS.MULTIPLE_SAME_ITEMS.threshold) {
      const score = RISK_FACTORS.MULTIPLE_SAME_ITEMS.weight;
      factors.push({
        factor: 'MULTIPLE_SAME_ITEMS',
        score,
        details: `${item.quantity} units of ${item.name}`
      });
      totalScore += score;
      break; // Only count once
    }
  }

  // 3. Check email domain
  const email = input.customerEmail;
  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (emailDomain && SUSPICIOUS_EMAIL_DOMAINS.includes(emailDomain)) {
    const score = RISK_FACTORS.NEW_EMAIL_DOMAIN.weight;
    factors.push({
      factor: 'SUSPICIOUS_EMAIL',
      score,
      details: `Email domain ${emailDomain} is flagged as temporary`
    });
    totalScore += score;
  }

  // 4. Check if first order (database check)
  if (input.userId) {
    const previousOrders = await prisma.order.count({
      where: {
        userId: input.userId,
        status: { notIn: ['cancelled', 'payment_failed'] }
      }
    });

    if (previousOrders === 0) {
      const score = RISK_FACTORS.FIRST_ORDER.weight;
      factors.push({
        factor: 'FIRST_ORDER',
        score,
        details: 'This is the customer\'s first order'
      });
      totalScore += score;
    }
  }

  // 5. Check customer risk profile (database check)
  if (input.userId) {
    const riskProfile = await prisma.customerRiskProfile.findUnique({
      where: { userId: input.userId }
    });

    if (riskProfile) {
      if (Number(riskProfile.riskScore) >= 70) {
        const score = RISK_FACTORS.PREVIOUS_FRAUD_FLAG.weight;
        factors.push({
          factor: 'HIGH_RISK_CUSTOMER',
          score,
          details: `Customer has risk score of ${riskProfile.riskScore}`
        });
        totalScore += score;
      }
    }
  }

  // 6. Check velocity (multiple orders in 24 hours - database check)
  if (input.customerEmail) {
    const recentOrders = await prisma.order.count({
      where: {
        customerEmail: input.customerEmail,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });

    // Note: Use > instead of >= because current order is not saved yet
    if (recentOrders >= RISK_FACTORS.VELOCITY_SPIKE.threshold) {
      const score = RISK_FACTORS.VELOCITY_SPIKE.weight;
      factors.push({
        factor: 'VELOCITY_SPIKE',
        score,
        details: `${recentOrders} orders from same email in 24 hours`
      });
      totalScore += score;
    }
  }

  // 7. Check shipping area
  if (input.shippingCity && BLACKLISTED_AREAS.includes(input.shippingCity.toLowerCase())) {
    const score = RISK_FACTORS.BLACKLISTED_AREA.weight;
    factors.push({
      factor: 'BLACKLISTED_AREA',
      score,
      details: `Shipping to flagged area: ${input.shippingCity}`
    });
    totalScore += score;
  }

  // Calculate risk level
  let riskLevel: FraudCheckResult['riskLevel'];
  let shouldBlock = false;
  let shouldReview = false;

  if (totalScore >= 70) {
    riskLevel = 'CRITICAL';
    shouldBlock = true;
    shouldReview = true;
  } else if (totalScore >= 50) {
    riskLevel = 'HIGH';
    shouldReview = true;
  } else if (totalScore >= 25) {
    riskLevel = 'MEDIUM';
    shouldReview = true;
  } else {
    riskLevel = 'LOW';
  }

  return {
    riskScore: totalScore,
    riskLevel,
    shouldBlock,
    shouldReview,
    factors
  };
}

/**
 * Analyze an existing order for fraud risk
 */
export async function analyzeOrderRisk(
  orderId: string
): Promise<FraudCheckResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: true
    }
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const result = await analyzeRisk({
    totalAmount: Number(order.totalPrice),
    items: order.items.map(i => ({ name: i.name, quantity: i.quantity })),
    customerEmail: order.customerEmail || order.user?.email || '',
    userId: order.userId,
    shippingCity: order.shippingCity || undefined
  });

  // Store the risk score
  await prisma.orderRiskScore.upsert({
    where: { orderId },
    create: {
      orderId,
      score: result.riskScore,
      factors: JSON.parse(JSON.stringify(result.factors)),
      reviewStatus: result.shouldReview ? 'pending' : 'approved',
      flagged: result.shouldReview
    },
    update: {
      score: result.riskScore,
      factors: JSON.parse(JSON.stringify(result.factors)),
      reviewStatus: result.shouldReview ? 'pending' : 'approved',
      flagged: result.shouldReview
    }
  });

  return result;
}


/**
 * Check if order should proceed based on fraud analysis
 * Returns true if order can proceed, false if blocked
 */
export async function checkOrderFraud(orderId: string): Promise<{
  allowed: boolean;
  reason?: string;
  riskScore: number;
}> {
  const result = await analyzeOrderRisk(orderId);

  if (result.shouldBlock) {
    return {
      allowed: false,
      reason: `Order blocked due to high fraud risk (score: ${result.riskScore}). Top factor: ${result.factors[0]?.factor}`,
      riskScore: result.riskScore
    };
  }

  return {
    allowed: true,
    riskScore: result.riskScore
  };
}

/**
 * Update customer risk profile based on order outcomes
 */
export async function updateCustomerRiskProfile(
  userId: string,
  event: 'SUCCESSFUL_ORDER' | 'CHARGEBACK' | 'FRAUD_CONFIRMED' | 'FALSE_POSITIVE'
) {
  const existing = await prisma.customerRiskProfile.findUnique({
    where: { userId }
  });

  let newScore = existing ? Number(existing.riskScore) : 0;
  const now = new Date();

  switch (event) {
    case 'SUCCESSFUL_ORDER':
      // Reduce risk slightly for successful orders
      newScore = Math.max(0, newScore - 5);
      break;
    case 'CHARGEBACK':
      // Significant increase for chargebacks
      newScore = Math.min(100, newScore + 30);
      break;
    case 'FRAUD_CONFIRMED':
      // Maximum risk
      newScore = 100;
      break;
    case 'FALSE_POSITIVE':
      // Reduce risk for false positives
      newScore = Math.max(0, newScore - 20);
      break;
  }

  await prisma.customerRiskProfile.upsert({
    where: { userId },
    create: {
      userId,
      riskScore: newScore,
      riskLevel: newScore >= 70 ? 'high' : newScore >= 40 ? 'elevated' : 'normal',
      lastOrderAt: now
    },
    update: {
      riskScore: newScore,
      riskLevel: newScore >= 70 ? 'high' : newScore >= 40 ? 'elevated' : 'normal',
      lastOrderAt: now
    }
  });

  return newScore;
}

/**
 * Get orders pending fraud review
 */
export async function getOrdersPendingFraudReview() {
  return prisma.orderRiskScore.findMany({
    where: {
      reviewStatus: 'PENDING'
    },
    include: {
      order: {
        include: {
          items: true,
          user: true
        }
      }
    },
    orderBy: { score: 'desc' }
  });
}

/**
 * Approve or reject an order after fraud review
 */
export async function completeFraudReview(
  orderId: string,
  decision: 'APPROVED' | 'REJECTED',
  reviewerId: string,
  notes?: string
) {
  await prisma.orderRiskScore.update({
    where: { orderId },
    data: {
      reviewStatus: decision.toLowerCase(),
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNote: notes
    }
  });

  if (decision === 'REJECTED') {
    // Cancel the order
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' }
    });
  }

  return { success: true };
}
