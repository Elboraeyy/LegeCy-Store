'use server';

import prisma from '@/lib/prisma';

/**
 * Cash Flow Forecast Service
 * 
 * Advanced cash flow projections with scenarios and alerts.
 */

// ============================================
// Types
// ============================================

export type ForecastPoint = {
  date: string;
  value: number;
  type: 'historical' | 'forecast';
  confidenceLow?: number;
  confidenceHigh?: number;
};

export type CashFlowScenario = {
  date: string;
  worst: number;
  expected: number;
  best: number;
};

export type CashAlert = {
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  daysUntil?: number;
};

export type CashFlowForecastResult = {
  currentCash: number;
  monthlyBurnRate: number;
  monthlyRevenue: number;
  runway: number;
  scenarios: CashFlowScenario[];
  alerts: CashAlert[];
  historicalData: { date: string; cashIn: number; cashOut: number; net: number }[];
  safetyLevel: number; // Minimum cash threshold
};

// ============================================
// Main Forecast Functions
// ============================================

/**
 * Get comprehensive cash flow forecast for 7/30/60 days
 */
export async function getCashFlowForecast(days: 7 | 30 | 60 = 30): Promise<CashFlowForecastResult> {
  const today = new Date();
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  
  // 1. Get current cash position from Treasury accounts
  const treasuryAccounts = await prisma.treasuryAccount.findMany();
  const currentCash = treasuryAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  
  // 2. Calculate average monthly revenue (from RevenueRecognition)
  const revenueData = await prisma.revenueRecognition.findMany({
    where: { recognizedAt: { gte: threeMonthsAgo } },
    select: { recognizedAt: true, netRevenue: true }
  });
  
  const monthlyRevenueMap: Record<string, number> = {};
  revenueData.forEach(r => {
    const key = r.recognizedAt.toISOString().slice(0, 7);
    monthlyRevenueMap[key] = (monthlyRevenueMap[key] || 0) + Number(r.netRevenue);
  });
  
  const revenueValues = Object.values(monthlyRevenueMap);
  const avgMonthlyRevenue = revenueValues.length > 0 
    ? revenueValues.reduce((a, b) => a + b, 0) / revenueValues.length 
    : 0;
  
  // 3. Calculate average monthly expenses
  const expenses = await prisma.expense.findMany({
    where: { 
      date: { gte: threeMonthsAgo },
      status: 'PAID'
    },
    select: { date: true, amount: true }
  });
  
  const monthlyExpenseMap: Record<string, number> = {};
  expenses.forEach(e => {
    const key = e.date.toISOString().slice(0, 7);
    monthlyExpenseMap[key] = (monthlyExpenseMap[key] || 0) + Number(e.amount);
  });
  
  const expenseValues = Object.values(monthlyExpenseMap);
  const avgMonthlyExpense = expenseValues.length > 0
    ? expenseValues.reduce((a, b) => a + b, 0) / expenseValues.length
    : 0;
  
  // 4. Get active marketing campaigns cost (rough estimate)
  // Using expenses with Marketing category
  const marketingCategory = await prisma.expenseCategory.findFirst({
    where: { name: { contains: 'Marketing', mode: 'insensitive' } }
  });
  
  let monthlyMarketingSpend = 0;
  if (marketingCategory) {
    const marketingExpenses = await prisma.expense.findMany({
      where: {
        categoryId: marketingCategory.id,
        date: { gte: threeMonthsAgo },
        status: 'PAID'
      }
    });
    monthlyMarketingSpend = marketingExpenses.reduce((sum, e) => sum + Number(e.amount), 0) / 3;
  }
  
  // 6. Calculate scenarios
  const scenarios: CashFlowScenario[] = [];
  const dailyBurnRate = avgMonthlyExpense / 30;
  const dailyRevenue = avgMonthlyRevenue / 30;
  
  let runningCashWorst = currentCash;
  let runningCashExpected = currentCash;
  let runningCashBest = currentCash;
  
  for (let i = 1; i <= days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);
    
    // Worst case: 70% revenue, 120% expenses
    runningCashWorst += (dailyRevenue * 0.7) - (dailyBurnRate * 1.2);
    
    // Expected case: normal
    runningCashExpected += dailyRevenue - dailyBurnRate;
    
    // Best case: 130% revenue, 80% expenses
    runningCashBest += (dailyRevenue * 1.3) - (dailyBurnRate * 0.8);
    
    scenarios.push({
      date: dateStr,
      worst: Math.max(0, runningCashWorst),
      expected: Math.max(0, runningCashExpected),
      best: runningCashBest
    });
  }
  
  // 7. Calculate runway (months until cash runs out at current burn)
  const netBurnRate = avgMonthlyExpense - avgMonthlyRevenue;
  const runway = netBurnRate > 0 ? currentCash / netBurnRate : 999;
  
  // 8. Define safety level (3 months of expenses)
  const safetyLevel = avgMonthlyExpense * 3;
  
  // 9. Generate alerts
  const alerts: CashAlert[] = [];
  
  // Find when cash goes below safety level
  const worstBelowSafety = scenarios.find(s => s.worst < safetyLevel);
  const expectedBelowSafety = scenarios.find(s => s.expected < safetyLevel);
  
  if (currentCash < safetyLevel) {
    alerts.push({
      type: 'danger',
      title: 'السيولة تحت الحد الآمن',
      message: `السيولة الحالية (${formatCurrency(currentCash)}) أقل من الحد الآمن (${formatCurrency(safetyLevel)})`
    });
  }
  
  if (worstBelowSafety) {
    const daysUntil = scenarios.indexOf(worstBelowSafety) + 1;
    alerts.push({
      type: 'warning',
      title: 'تحذير سيولة - السيناريو السيء',
      message: `في حالة انخفاض المبيعات، السيولة ستنزل تحت الحد الآمن خلال ${daysUntil} يوم`,
      daysUntil
    });
  }
  
  if (expectedBelowSafety) {
    const daysUntil = scenarios.indexOf(expectedBelowSafety) + 1;
    alerts.push({
      type: 'danger',
      title: 'خطر سيولة قريب',
      message: `السيولة المتوقعة ستنزل تحت الحد الآمن خلال ${daysUntil} يوم`,
      daysUntil
    });
  }
  
  if (runway < 6 && runway > 0) {
    alerts.push({
      type: 'warning',
      title: 'Runway منخفض',
      message: `المصروفات تتجاوز الإيرادات. السيولة تكفي ${runway.toFixed(1)} شهر فقط`
    });
  }
  
  if (marketingSpend(avgMonthlyRevenue, monthlyMarketingSpend)) {
    alerts.push({
      type: 'info',
      title: 'مصروفات التسويق عالية',
      message: `التسويق يستهلك ${((monthlyMarketingSpend / avgMonthlyRevenue) * 100).toFixed(0)}% من الإيرادات`
    });
  }
  
  // 10. Get historical data for chart
  const historicalData = await getHistoricalCashFlow(3);
  
  return {
    currentCash,
    monthlyBurnRate: avgMonthlyExpense,
    monthlyRevenue: avgMonthlyRevenue,
    runway: Math.min(runway, 999),
    scenarios,
    alerts,
    historicalData,
    safetyLevel
  };
}

function marketingSpend(revenue: number, marketing: number): boolean {
  if (revenue === 0) return false;
  return (marketing / revenue) > 0.25; // Alert if marketing > 25% of revenue
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-EG', { 
    style: 'currency', 
    currency: 'EGP',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Get historical cash flow data for the last N months
 */
async function getHistoricalCashFlow(months: number) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);
  
  // Get revenue by month
  const revenue = await prisma.revenueRecognition.findMany({
    where: { recognizedAt: { gte: startDate } },
    select: { recognizedAt: true, netRevenue: true }
  });
  
  // Get expenses by month
  const expenses = await prisma.expense.findMany({
    where: { date: { gte: startDate }, status: 'PAID' },
    select: { date: true, amount: true }
  });
  
  const monthlyData: Record<string, { cashIn: number; cashOut: number }> = {};
  
  revenue.forEach(r => {
    const key = r.recognizedAt.toISOString().slice(0, 7);
    if (!monthlyData[key]) monthlyData[key] = { cashIn: 0, cashOut: 0 };
    monthlyData[key].cashIn += Number(r.netRevenue);
  });
  
  expenses.forEach(e => {
    const key = e.date.toISOString().slice(0, 7);
    if (!monthlyData[key]) monthlyData[key] = { cashIn: 0, cashOut: 0 };
    monthlyData[key].cashOut += Number(e.amount);
  });
  
  return Object.entries(monthlyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      date,
      cashIn: data.cashIn,
      cashOut: data.cashOut,
      net: data.cashIn - data.cashOut
    }));
}

// ============================================
// Break-Even Calculator
// ============================================

export type BreakEvenResult = {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  unitCost: number;
  profitMargin: number;
  profitMarginPercent: number;
  monthlyFixedCosts: number;
  unitsToBreakEven: number;
  currentMonthlySales: number;
  status: 'profitable' | 'break-even' | 'loss';
};

export type BrandBreakEvenResult = {
  totalMonthlyFixedCosts: number;
  avgProfitMargin: number;
  unitsToBreakEven: number;
  currentMonthlySales: number;
  status: 'profitable' | 'break-even' | 'loss';
  revenueToBreakEven: number;
};

/**
 * Calculate break-even for a specific product
 */
export async function getProductBreakEven(productId: string): Promise<BreakEvenResult | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: true
    }
  });
  
  if (!product) return null;
  
  // Get average selling price from variants
  const avgPrice = product.variants.length > 0
    ? product.variants.reduce((sum, v) => sum + Number(v.price), 0) / product.variants.length
    : 0;
  
  // Get average cost from variants
  const avgCost = product.variants.length > 0
    ? product.variants.reduce((sum, v) => sum + Number(v.costPrice || 0), 0) / product.variants.length
    : Number(product.costPrice || 0);
  
  const profitMargin = avgPrice - avgCost;
  const profitMarginPercent = avgPrice > 0 ? (profitMargin / avgPrice) * 100 : 0;
  
  // Get monthly fixed costs (allocated per product - simplified)
  const totalProducts = await prisma.product.count({ where: { status: 'active' } });
  const monthlyExpenses = await getMonthlyFixedCosts();
  const allocatedFixedCosts = totalProducts > 0 ? monthlyExpenses / totalProducts : 0;
  
  // Calculate units needed to break even
  const unitsToBreakEven = profitMargin > 0 ? Math.ceil(allocatedFixedCosts / profitMargin) : Infinity;
  
  // Get current monthly sales for this product
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentSales = await prisma.orderItem.aggregate({
    where: {
      productId,
      order: {
        createdAt: { gte: thirtyDaysAgo },
        status: { in: ['delivered', 'shipped', 'processing'] }
      }
    },
    _sum: { quantity: true }
  });
  
  const currentMonthlySales = recentSales._sum.quantity || 0;
  
  let status: 'profitable' | 'break-even' | 'loss' = 'loss';
  if (currentMonthlySales > unitsToBreakEven) status = 'profitable';
  else if (currentMonthlySales === unitsToBreakEven) status = 'break-even';
  
  return {
    productId,
    productName: product.name,
    sku: product.variants[0]?.sku || 'N/A',
    unitPrice: avgPrice,
    unitCost: avgCost,
    profitMargin,
    profitMarginPercent,
    monthlyFixedCosts: allocatedFixedCosts,
    unitsToBreakEven: unitsToBreakEven === Infinity ? 0 : unitsToBreakEven,
    currentMonthlySales,
    status
  };
}

/**
 * Calculate brand-level break-even
 */
export async function getBrandBreakEven(): Promise<BrandBreakEvenResult> {
  const monthlyFixedCosts = await getMonthlyFixedCosts();
  
  // Get all active products with costs
  const products = await prisma.product.findMany({
    where: { status: 'active' },
    include: { variants: true }
  });
  
  // Calculate average profit margin across all products
  let totalMargin = 0;
  let productCount = 0;
  
  products.forEach(product => {
    if (product.variants.length > 0) {
      const avgPrice = product.variants.reduce((sum, v) => sum + Number(v.price), 0) / product.variants.length;
      const avgCost = product.variants.reduce((sum, v) => sum + Number(v.costPrice || 0), 0) / product.variants.length;
      totalMargin += avgPrice - avgCost;
      productCount++;
    }
  });
  
  const avgProfitMargin = productCount > 0 ? totalMargin / productCount : 0;
  
  // Units to break even
  const unitsToBreakEven = avgProfitMargin > 0 ? Math.ceil(monthlyFixedCosts / avgProfitMargin) : 0;
  
  // Current monthly sales
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentSales = await prisma.orderItem.aggregate({
    where: {
      order: {
        createdAt: { gte: thirtyDaysAgo },
        status: { in: ['delivered', 'shipped', 'processing'] }
      }
    },
    _sum: { quantity: true }
  });
  
  const currentMonthlySales = recentSales._sum.quantity || 0;
  
  // Revenue to break even
  const avgPrice = products.length > 0
    ? products.reduce((sum, p) => {
        const variantAvg = p.variants.length > 0
          ? p.variants.reduce((s, v) => s + Number(v.price), 0) / p.variants.length
          : 0;
        return sum + variantAvg;
      }, 0) / products.length
    : 0;
  
  const revenueToBreakEven = unitsToBreakEven * avgPrice;
  
  let status: 'profitable' | 'break-even' | 'loss' = 'loss';
  if (currentMonthlySales > unitsToBreakEven) status = 'profitable';
  else if (currentMonthlySales === unitsToBreakEven) status = 'break-even';
  
  return {
    totalMonthlyFixedCosts: monthlyFixedCosts,
    avgProfitMargin,
    unitsToBreakEven,
    currentMonthlySales,
    status,
    revenueToBreakEven
  };
}

async function getMonthlyFixedCosts(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const expenses = await prisma.expense.aggregate({
    where: {
      date: { gte: thirtyDaysAgo },
      status: 'PAID'
    },
    _sum: { amount: true }
  });
  
  return Number(expenses._sum.amount || 0);
}

// ============================================
// Profit Quality Indicator
// ============================================

export type ProfitQualityResult = {
  score: number; // 0-100
  breakdown: {
    realSalesPercent: number;
    discountImpact: number;
    returnImpact: number;
    adSpendImpact: number;
    codRiskImpact: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  riskFactors: string[];
};

/**
 * Calculate profit quality score
 * Higher score = healthier profit
 */
export async function getProfitQuality(): Promise<ProfitQualityResult> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  
  // Get total revenue this month
  const currentRevenue = await prisma.revenueRecognition.aggregate({
    where: { recognizedAt: { gte: thirtyDaysAgo } },
    _sum: { grossRevenue: true, discountAmount: true, netRevenue: true }
  });
  
  const grossRevenue = Number(currentRevenue._sum.grossRevenue || 0);
  const discounts = Number(currentRevenue._sum.discountAmount || 0);
  const netRevenue = Number(currentRevenue._sum.netRevenue || 0);
  
  // Get return requests impact
  const returns = await prisma.returnRequest.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      status: { in: ['approved', 'completed'] }
    },
    include: { order: true }
  });
  
  const returnValue = returns.reduce((sum, r) => sum + Number(r.order.totalPrice), 0);
  
  // Get ad spend (marketing expenses)
  const marketingCategory = await prisma.expenseCategory.findFirst({
    where: { name: { contains: 'Marketing', mode: 'insensitive' } }
  });
  
  let adSpend = 0;
  if (marketingCategory) {
    const marketingExpenses = await prisma.expense.aggregate({
      where: {
        categoryId: marketingCategory.id,
        date: { gte: thirtyDaysAgo },
        status: 'PAID'
      },
      _sum: { amount: true }
    });
    adSpend = Number(marketingExpenses._sum.amount || 0);
  }
  
  // Get COD orders (higher risk)
  const codOrders = await prisma.order.count({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      paymentMethod: 'cod'
    }
  });
  
  const totalOrders = await prisma.order.count({
    where: { createdAt: { gte: thirtyDaysAgo } }
  });
  
  const codPercent = totalOrders > 0 ? (codOrders / totalOrders) * 100 : 0;
  
  // Calculate Score Components (each contributes to 100)
  const baseScore = 100;
  
  // Discount impact: loses points if discounts > 10% of gross
  const discountPercent = grossRevenue > 0 ? (discounts / grossRevenue) * 100 : 0;
  const discountPenalty = Math.min(discountPercent * 1.5, 25); // Max 25 point penalty
  
  // Return impact: loses points if returns > 5% of revenue
  const returnPercent = netRevenue > 0 ? (returnValue / netRevenue) * 100 : 0;
  const returnPenalty = Math.min(returnPercent * 2, 20); // Max 20 point penalty
  
  // Ad spend impact: loses points if ad spend > 25% of revenue
  const adPercent = netRevenue > 0 ? (adSpend / netRevenue) * 100 : 0;
  const adPenalty = adPercent > 25 ? Math.min((adPercent - 25) * 1, 20) : 0; // Max 20 point penalty
  
  // COD risk: loses points if COD > 60%
  const codPenalty = codPercent > 60 ? Math.min((codPercent - 60) * 0.5, 15) : 0; // Max 15 point penalty
  
  const score = Math.max(0, Math.round(baseScore - discountPenalty - returnPenalty - adPenalty - codPenalty));
  
  // Get previous month for trend
  const previousRevenue = await prisma.revenueRecognition.aggregate({
    where: { 
      recognizedAt: { 
        gte: sixtyDaysAgo,
        lt: thirtyDaysAgo
      } 
    },
    _sum: { grossRevenue: true, discountAmount: true }
  });
  
  const prevGross = Number(previousRevenue._sum.grossRevenue || 0);
  const prevDiscounts = Number(previousRevenue._sum.discountAmount || 0);
  const prevDiscountPercent = prevGross > 0 ? (prevDiscounts / prevGross) * 100 : 0;
  
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (discountPercent < prevDiscountPercent - 5) trend = 'improving';
  else if (discountPercent > prevDiscountPercent + 5) trend = 'declining';
  
  // Identify risk factors
  const riskFactors: string[] = [];
  if (discountPercent > 15) riskFactors.push('خصومات عالية تقلل هامش الربح');
  if (returnPercent > 8) riskFactors.push('نسبة المرتجعات مرتفعة');
  if (adPercent > 30) riskFactors.push('مصروفات الإعلانات تستهلك الأرباح');
  if (codPercent > 70) riskFactors.push('اعتماد عالي على COD يزيد المخاطر');
  
  return {
    score,
    breakdown: {
      realSalesPercent: Math.round(100 - discountPercent),
      discountImpact: Math.round(discountPenalty),
      returnImpact: Math.round(returnPenalty),
      adSpendImpact: Math.round(adPenalty),
      codRiskImpact: Math.round(codPenalty)
    },
    trend,
    riskFactors
  };
}

// ============================================
// Partner Wallets
// ============================================

export type PartnerWallet = {
  id: string;
  name: string;
  type: string;
  capitalContributed: number;
  totalEarnings: number;
  withdrawn: number;
  remaining: number;
  sharePercent: number;
  lastTransaction?: {
    type: string;
    amount: number;
    date: Date;
  };
};

/**
 * Get all partner wallets with financial summary
 */
export async function getPartnerWallets(): Promise<PartnerWallet[]> {
  const investors = await prisma.investor.findMany({
    where: { isActive: true },
    include: {
      transactions: {
        orderBy: { date: 'desc' }
      }
    }
  });
  
  // Calculate total profit for distribution
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const revenueData = await prisma.revenueRecognition.aggregate({
    where: { recognizedAt: { gte: thirtyDaysAgo } },
    _sum: { grossProfit: true }
  });
  
  const monthlyProfit = Number(revenueData._sum.grossProfit || 0);
  
  // Total capital for share calculation
  const totalCapital = investors.reduce((sum, inv) => sum + Number(inv.netContributed), 0);
  
  return investors.map(investor => {
    // Calculate capital contributed (sum of deposits)
    const deposits = investor.transactions
      .filter(t => t.type === 'DEPOSIT')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Calculate withdrawn (sum of withdrawals)
    const withdrawn = investor.transactions
      .filter(t => t.type === 'WITHDRAWAL')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Calculate share percentage
    const sharePercent = totalCapital > 0 
      ? (Number(investor.netContributed) / totalCapital) * 100 
      : 0;
    
    // Calculate earnings based on share
    const totalEarnings = monthlyProfit * (sharePercent / 100);
    
    // Remaining = Capital + Earnings - Withdrawn
    const remaining = deposits + totalEarnings - withdrawn;
    
    const lastTx = investor.transactions[0];
    
    return {
      id: investor.id,
      name: investor.name,
      type: investor.type,
      capitalContributed: deposits,
      totalEarnings,
      withdrawn,
      remaining,
      sharePercent,
      lastTransaction: lastTx ? {
        type: lastTx.type,
        amount: Number(lastTx.amount),
        date: lastTx.date
      } : undefined
    };
  });
}
