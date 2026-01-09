'use server';

import prisma from '@/lib/prisma';

/**
 * Decision Log Service
 * 
 * Tracks major business decisions with context and outcome evaluation.
 */

// ============================================
// Types
// ============================================

export type DecisionType = 'pricing' | 'marketing' | 'inventory' | 'partnership' | 'operations';

export type DecisionInput = {
  type: DecisionType;
  title: string;
  description: string;
  contextData: Record<string, unknown>;
  expectedOutcome?: string;
  decisionMaker: string;
  decisionMakerName?: string;
};

export type DecisionEvaluation = {
  actualOutcome: string;
  outcomeScore: number; // -100 to 100
  evaluationNotes?: string;
  evaluatedBy: string;
};

// ============================================
// Decision Logging
// ============================================

/**
 * Log a new major decision
 */
export async function logDecision(input: DecisionInput) {
  return await prisma.decisionLog.create({
    data: {
      type: input.type,
      title: input.title,
      description: input.description,
      contextData: input.contextData as object,
      expectedOutcome: input.expectedOutcome,
      decisionMaker: input.decisionMaker,
      decisionMakerName: input.decisionMakerName || 'Unknown'
    }
  });
}

/**
 * Evaluate a decision's outcome
 */
export async function evaluateDecision(decisionId: string, evaluation: DecisionEvaluation) {
  return await prisma.decisionLog.update({
    where: { id: decisionId },
    data: {
      actualOutcome: evaluation.actualOutcome,
      outcomeScore: evaluation.outcomeScore,
      evaluationNotes: evaluation.evaluationNotes,
      evaluatedBy: evaluation.evaluatedBy,
      evaluatedAt: new Date()
    }
  });
}

/**
 * Get all decisions with optional filtering
 */
export async function getDecisions(options?: {
  type?: DecisionType;
  evaluated?: boolean;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  
  if (options?.type) {
    where.type = options.type;
  }
  
  if (options?.evaluated !== undefined) {
    where.evaluatedAt = options.evaluated ? { not: null } : null;
  }
  
  return await prisma.decisionLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50
  });
}

/**
 * Get decisions pending evaluation (older than 30 days)
 */
export async function getPendingEvaluations() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return await prisma.decisionLog.findMany({
    where: {
      createdAt: { lt: thirtyDaysAgo },
      evaluatedAt: null
    },
    orderBy: { createdAt: 'asc' }
  });
}

// ============================================
// CEO Daily Brief
// ============================================

export type CEOBriefData = {
  keyMetrics: {
    label: string;
    value: string;
    change?: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  alerts: {
    type: 'danger' | 'warning' | 'info';
    title: string;
    message: string;
  }[];
  pendingDecisions: {
    id: string;
    type: string;
    title: string;
    requestedBy: string;
    requestedAt: Date;
  }[];
};

/**
 * Get CEO Daily Brief data
 */
export async function getCEODailyBrief(): Promise<CEOBriefData> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Get key metrics
  
  // Today's orders
  const todayOrders = await prisma.order.count({
    where: { createdAt: { gte: new Date(today.setHours(0, 0, 0, 0)) } }
  });
  
  const yesterdayOrders = await prisma.order.count({
    where: {
      createdAt: {
        gte: new Date(yesterday.setHours(0, 0, 0, 0)),
        lt: new Date(today.setHours(0, 0, 0, 0))
      }
    }
  });
  
  // Today's revenue
  const todayRevenue = await prisma.order.aggregate({
    where: { 
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      status: { in: ['delivered', 'shipped', 'processing', 'confirmed'] }
    },
    _sum: { totalPrice: true }
  });
  
  // Cash balance
  const treasuryAccounts = await prisma.treasuryAccount.findMany();
  const cashBalance = treasuryAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  
  // Pending orders
  const pendingOrders = await prisma.order.count({
    where: { status: { in: ['pending', 'confirmed'] } }
  });
  
  // Monthly revenue
  const monthlyRevenue = await prisma.revenueRecognition.aggregate({
    where: { recognizedAt: { gte: thirtyDaysAgo } },
    _sum: { netRevenue: true }
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toFixed(0);
  };

  const keyMetrics: CEOBriefData['keyMetrics'] = [
    {
      label: 'طلبات اليوم',
      value: todayOrders.toString(),
      change: yesterdayOrders > 0 ? ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100 : 0,
      trend: todayOrders > yesterdayOrders ? 'up' : todayOrders < yesterdayOrders ? 'down' : 'stable'
    },
    {
      label: 'إيراد اليوم',
      value: formatCurrency(Number(todayRevenue._sum.totalPrice || 0)) + ' ج.م',
      trend: 'stable'
    },
    {
      label: 'السيولة',
      value: formatCurrency(cashBalance) + ' ج.م',
      trend: 'stable'
    },
    {
      label: 'طلبات معلقة',
      value: pendingOrders.toString(),
      trend: pendingOrders > 10 ? 'down' : 'stable'
    },
    {
      label: 'إيراد الشهر',
      value: formatCurrency(Number(monthlyRevenue._sum.netRevenue || 0)) + ' ج.م',
      trend: 'stable'
    }
  ];

  // 2. Get alerts
  const alerts: CEOBriefData['alerts'] = [];
  
  // Low stock alert
  const lowStock = await prisma.inventory.count({
    where: { available: { lte: 5 }, reserved: { gte: 0 } }
  });
  if (lowStock > 0) {
    alerts.push({
      type: 'warning',
      title: 'مخزون منخفض',
      message: `${lowStock} منتج بمخزون 5 قطع أو أقل`
    });
  }
  
  // Flagged orders
  const flaggedOrders = await prisma.orderRiskScore.count({
    where: { flagged: true, reviewStatus: 'pending' }
  });
  if (flaggedOrders > 0) {
    alerts.push({
      type: 'danger',
      title: 'طلبات مشبوهة',
      message: `${flaggedOrders} طلب يحتاج مراجعة`
    });
  }
  
  // Pending returns
  const pendingReturns = await prisma.returnRequest.count({
    where: { status: 'pending' }
  });
  if (pendingReturns > 0) {
    alerts.push({
      type: 'info',
      title: 'طلبات مرتجع',
      message: `${pendingReturns} طلب مرتجع بانتظار المراجعة`
    });
  }

  // 3. Get pending decisions (approvals)
  const pendingApprovals = await prisma.approvalRequest.findMany({
    where: { status: 'pending' },
    orderBy: { requestedAt: 'desc' },
    take: 3,
    include: { rule: true }
  });

  const pendingDecisions = pendingApprovals.map(req => ({
    id: req.id,
    type: req.entityType,
    title: req.rule.name,
    requestedBy: req.requestedBy,
    requestedAt: req.requestedAt
  }));

  return { keyMetrics, alerts, pendingDecisions };
}

// ============================================
// Fraud Watch
// ============================================

/**
 * Get customer risk profiles
 */
export async function getCustomerRiskProfiles(riskLevel?: string) {
  const where: Record<string, unknown> = {};
  if (riskLevel) {
    where.riskLevel = riskLevel;
  }
  
  return await prisma.customerRiskProfile.findMany({
    where,
    orderBy: { riskScore: 'desc' },
    take: 50
  });
}

/**
 * Update customer risk profile
 */
export async function updateCustomerRiskLevel(
  profileId: string, 
  riskLevel: 'normal' | 'elevated' | 'high' | 'blocked',
  notes?: string,
  blockedBy?: string
) {
  const updateData: Record<string, unknown> = { riskLevel, notes };
  
  if (riskLevel === 'blocked' && blockedBy) {
    updateData.blockedAt = new Date();
    updateData.blockedBy = blockedBy;
  }
  
  return await prisma.customerRiskProfile.update({
    where: { id: profileId },
    data: updateData
  });
}
