import prisma from '@/lib/prisma';
import { revenueOrderStatusFilter } from '@/lib/order-metrics';

function n(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = v as { toNumber?: () => number };
  if (typeof d.toNumber === 'function') return d.toNumber();
  return Number(v) || 0;
}

export type InsightsDateRange = { start: Date; end: Date };

export function parseInsightsRange(
  startParam: string | null,
  endParam: string | null,
  monthParam: string | null,
  yearParam: string | null
): InsightsDateRange {
  const now = new Date();
  if (startParam && endParam) {
    const start = new Date(startParam);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endParam);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

/** Treasury — same source as Treasury screen (Safe.balance) */
export async function getTreasuryInsights() {
  const safes = await prisma.safe.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  const byType = { CASH: 0, BANK: 0, WALLET: 0, OTHER: 0 };
  let totalBalance = 0;
  const safeList = safes.map((s) => {
    const bal = n(s.balance);
    totalBalance += bal;
    const t = s.type as keyof typeof byType;
    if (byType[t] !== undefined) byType[t] += bal;
    else byType.OTHER += bal;
    return { id: s.id, name: s.name, type: s.type, balance: bal };
  });

  return { totalBalance, safeCount: safes.length, byType, safes: safeList };
}

/** Cash movements — same ledger as Cash safe history */
export async function getCashFlowInsights(range: InsightsDateRange) {
  const cash = await prisma.safe.findUnique({ where: { name: 'Cash' } });
  if (!cash) {
    return {
      cashSafeName: null,
      periodIn: 0,
      periodOut: 0,
      periodNet: 0,
      currentBalance: 0,
      byReference: [] as { type: string; in: number; out: number; count: number }[],
      dailyTrend: [] as { date: string; in: number; out: number }[],
    };
  }

  const txs = await prisma.safeTransaction.findMany({
    where: { safeId: cash.id, createdAt: { gte: range.start, lte: range.end } },
    orderBy: { createdAt: 'asc' },
  });

  const byRef = new Map<string, { in: number; out: number; count: number }>();
  let periodIn = 0;
  let periodOut = 0;
  const dailyMap = new Map<string, { in: number; out: number }>();

  for (const tx of txs) {
    const ref = tx.referenceType || 'OTHER';
    const amt = n(tx.amount);
    const cur = byRef.get(ref) || { in: 0, out: 0, count: 0 };
    cur.count++;
    if (tx.type === 'CREDIT' || tx.type === 'TRANSFER_IN') {
      cur.in += amt;
      periodIn += amt;
    } else {
      cur.out += amt;
      periodOut += amt;
    }
    byRef.set(ref, cur);

    const day = tx.createdAt.toISOString().split('T')[0];
    const d = dailyMap.get(day) || { in: 0, out: 0 };
    if (tx.type === 'CREDIT' || tx.type === 'TRANSFER_IN') d.in += amt;
    else d.out += amt;
    dailyMap.set(day, d);
  }

  const dailyTrend = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, in: Math.round(v.in), out: Math.round(v.out) }));

  return {
    cashSafeName: cash.name,
    periodIn: Math.round(periodIn),
    periodOut: Math.round(periodOut),
    periodNet: Math.round(periodIn - periodOut),
    currentBalance: n(cash.balance),
    byReference: Array.from(byRef.entries()).map(([type, v]) => ({
      type,
      in: Math.round(v.in),
      out: Math.round(v.out),
      count: v.count,
    })),
    dailyTrend,
  };
}

/** Orders audit — financially audited delivered orders (source of truth for P&L per order) */
export async function getAuditedOrdersInsights(range: InsightsDateRange) {
  const auditedWhere = {
    status: 'delivered' as const,
    isFinanciallyAudited: true,
    deliveredAt: { gte: range.start, lte: range.end },
  };

  const [auditedOrders, pendingAudit, deliveredNotAudited] = await Promise.all([
    prisma.order.findMany({
      where: auditedWhere,
      select: {
        id: true,
        orderNumber: true,
        totalPrice: true,
        wholesaleCost: true,
        packagingCost: true,
        actualShippingCost: true,
        extraExpenses: true,
        netProfit: true,
        paymentMethod: true,
        deliveredAt: true,
      },
    }),
    prisma.order.count({
      where: {
        status: 'delivered',
        isFinanciallyAudited: false,
        deliveredAt: { gte: range.start, lte: range.end },
      },
    }),
    prisma.order.count({
      where: { status: 'delivered', isFinanciallyAudited: false },
    }),
  ]);

  let revenue = 0;
  let costs = 0;
  let netProfit = 0;
  const byPayment = new Map<string, { count: number; revenue: number }>();

  for (const o of auditedOrders) {
    const rev = n(o.totalPrice);
    const cost =
      n(o.wholesaleCost) +
      n(o.packagingCost) +
      n(o.actualShippingCost) +
      n(o.extraExpenses);
    revenue += rev;
    costs += cost;
    netProfit += n(o.netProfit) || rev - cost;

    const pm = o.paymentMethod || 'unknown';
    const p = byPayment.get(pm) || { count: 0, revenue: 0 };
    p.count++;
    p.revenue += rev;
    byPayment.set(pm, p);
  }

  return {
    auditedCount: auditedOrders.length,
    pendingAuditInPeriod: pendingAudit,
    deliveredNotAuditedTotal: deliveredNotAudited,
    revenue: Math.round(revenue),
    costs: Math.round(costs),
    netProfit: Math.round(netProfit),
    grossMarginPct: revenue > 0 ? Math.round((netProfit / revenue) * 1000) / 10 : 0,
    byPayment: Array.from(byPayment.entries()).map(([method, v]) => ({
      method,
      count: v.count,
      revenue: Math.round(v.revenue),
    })),
  };
}

/** Expenses — aligned with Expenses screen (PAID, operating vs capital vs amortized slice) */
export async function getExpensesInsights(range: InsightsDateRange) {
  const directExpenses = await prisma.expense.findMany({
    where: {
      date: { gte: range.start, lte: range.end },
      status: 'PAID',
    },
    include: {
      category: { select: { name: true } },
      safe: { select: { name: true } },
    },
  });

  const allAmortized = await prisma.expense.findMany({
    where: { isAmortized: true, amortStartDate: { lte: range.end }, status: 'PAID' },
  });

  const year = range.end.getFullYear();
  const month = range.end.getMonth() + 1;
  const currentMonthIndex = year * 12 + (month - 1);

  const amortizedSlice = allAmortized
    .filter((e) => {
      if (!e.amortStartDate) return false;
      const start = new Date(e.amortStartDate);
      const startM = start.getFullYear() * 12 + start.getMonth();
      const endM = startM + e.spreadMonths - 1;
      return currentMonthIndex >= startM && currentMonthIndex <= endM;
    })
    .reduce((s, e) => s + n(e.monthlyAmount), 0);

  let operatingCash = 0;
  let capitalCash = 0;
  let amortizedCashFull = 0;
  let operatingPnl = 0;
  let capitalCount = 0;

  const byCategory = new Map<string, { amount: number; count: number }>();
  const byType = { OPERATING: 0, CAPITAL: 0, AMORTIZED: 0 };

  for (const e of directExpenses) {
    const amt = n(e.amount);
    const cat = e.category?.name || 'Unknown';
    const c = byCategory.get(cat) || { amount: 0, count: 0 };
    c.amount += amt;
    c.count++;
    byCategory.set(cat, c);

    if (e.isAmortized || e.expenseType === 'AMORTIZED') {
      byType.AMORTIZED += amt;
      amortizedCashFull += amt;
    } else if (e.expenseType === 'CAPITAL') {
      byType.CAPITAL += amt;
      capitalCash += amt;
      capitalCount++;
    } else {
      byType.OPERATING += amt;
      operatingCash += amt;
      operatingPnl += amt;
    }
  }

  return {
    totalCashOut: Math.round(
      directExpenses.reduce((s, e) => s + (e.safeId ? n(e.amount) : 0), 0)
    ),
    operatingCash: Math.round(operatingCash),
    capitalCash: Math.round(capitalCash),
    amortizedCashFull: Math.round(amortizedCashFull),
    operatingPnlMonth: Math.round(operatingPnl),
    amortizedPnlSlice: Math.round(amortizedSlice),
    totalPnlExpenses: Math.round(operatingPnl + amortizedSlice),
    capitalCount,
    expenseCount: directExpenses.length,
    byCategory: Array.from(byCategory.entries())
      .map(([category, v]) => ({ category, amount: Math.round(v.amount), count: v.count }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 12),
    byType: {
      operating: Math.round(byType.OPERATING),
      capital: Math.round(byType.CAPITAL),
      amortized: Math.round(byType.AMORTIZED),
    },
  };
}

/** Month closing — same as Month Closing screen */
export async function getMonthClosingInsights() {
  const closings = await prisma.monthClosing.findMany({
    where: { status: 'CLOSED' },
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
    include: { partnerDistributions: true },
  });

  return {
    closedMonths: closings.length,
    months: closings.map((mc) => ({
      month: mc.month,
      year: mc.year,
      totalRevenue: n(mc.totalRevenue),
      netProfit: n(mc.netProfit),
      grossProfit: n(mc.grossProfit),
      totalOperatingExpenses: n(mc.totalOperatingExpenses),
      reinvestmentAmount: n(mc.reinvestmentAmount),
      distributionAmount: n(mc.distributionAmount),
      auditedOrders: mc.auditedOrders,
    })),
    cumulativeNetProfit: Math.round(closings.reduce((s, m) => s + n(m.netProfit), 0)),
    cumulativeReinvestment: Math.round(
      closings.reduce((s, m) => s + n(m.reinvestmentAmount), 0)
    ),
  };
}

/** Inventory — book value at cost */
export async function getInventoryInsights() {
  const inventory = await prisma.inventory.findMany({
    include: { variant: { select: { costPrice: true, sku: true } } },
  });

  let bookValue = 0;
  let totalUnits = 0;
  let lowStock = 0;
  let outOfStock = 0;

  for (const inv of inventory) {
    const cost = n(inv.variant?.costPrice);
    const avail = inv.available;
    bookValue += cost * avail;
    totalUnits += avail;
    if (avail <= 0) outOfStock++;
    else if (avail <= 5) lowStock++;
  }

  const productCount = await prisma.product.count({ where: { status: 'active' } });

  return {
    productCount,
    skuCount: inventory.length,
    totalUnits,
    bookValue: Math.round(bookValue),
    lowStock,
    outOfStock,
  };
}

/** Procurement / suppliers */
export async function getProcurementInsights() {
  const [suppliers, invoicesPosted, payablesOpen] = await Promise.all([
    prisma.supplier.findMany({
      select: { id: true, name: true, accountBalance: true },
      orderBy: { accountBalance: 'desc' },
      take: 10,
    }),
    prisma.purchaseInvoice.aggregate({
      where: { status: 'POSTED' },
      _sum: { grandTotal: true },
      _count: true,
    }),
    prisma.purchaseInvoice.aggregate({
      where: { status: { in: ['POSTED', 'APPROVED'] } },
      _sum: { remainingAmount: true },
    }),
  ]);

  return {
    supplierCount: suppliers.length,
    topSuppliersByBalance: suppliers.map((s) => ({
      name: s.name,
      balance: n(s.accountBalance),
    })),
    postedInvoicesTotal: n(invoicesPosted._sum.grandTotal),
    postedInvoicesCount: invoicesPosted._count,
    outstandingPayables: n(payablesOpen._sum.remainingAmount),
  };
}

/** Sales pipeline orders (operational, not yet audited) */
export async function getOperationalOrdersInsights(range: InsightsDateRange) {
  const [pipelineRevenue, pipelineCount, deliveredInPeriod, cancelledInPeriod] =
    await Promise.all([
      prisma.order.aggregate({
        where: { createdAt: { gte: range.start, lte: range.end }, status: revenueOrderStatusFilter },
        _sum: { totalPrice: true },
      }),
      prisma.order.count({
        where: { createdAt: { gte: range.start, lte: range.end }, status: revenueOrderStatusFilter },
      }),
      prisma.order.count({
        where: { status: 'delivered', deliveredAt: { gte: range.start, lte: range.end } },
      }),
      prisma.order.count({
        where: {
          status: { in: ['cancelled', 'CANCELLED'] },
          createdAt: { gte: range.start, lte: range.end },
        },
      }),
    ]);

  return {
    pipelineRevenue: n(pipelineRevenue._sum.totalPrice),
    pipelineOrderCount: pipelineCount,
    deliveredInPeriod,
    cancelledInPeriod,
  };
}

/** Partners / investors — wallets, month closing, withdrawals (My Wallet + Month Closing screens) */
export async function getPartnersInsights() {
  const now = new Date();
  const range = {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };

  const [
    investors,
    monthClosing,
    auditedMonth,
    pendingWithdrawals,
    approvedWithdrawalsFromCash,
  ] = await Promise.all([
    prisma.investor.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        withdrawals: { orderBy: { createdAt: 'desc' }, take: 5 },
        monthDistributions: {
          include: { monthClosing: { select: { month: true, year: true, status: true } } },
          orderBy: { monthClosing: { year: 'desc' } },
        },
      },
    }),
    getMonthClosingInsights(),
    getAuditedOrdersInsights(range),
    prisma.partnerWithdrawal.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.partnerWithdrawal.aggregate({
      where: { status: 'APPROVED' },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const partnerInvestors = investors.filter((i) => i.type === 'PARTNER');
  const equityInvestors = investors.filter((i) => i.type !== 'PARTNER');

  const totalWallet = investors.reduce((s, i) => s + n(i.walletBalance), 0);
  const totalEarnings = investors.reduce((s, i) => s + n(i.totalEarnings), 0);
  const totalWithdrawn = investors.reduce((s, i) => s + n(i.totalWithdrawn), 0);
  const totalContributed = investors.reduce((s, i) => s + n(i.netContributed), 0);

  const lastClosed = monthClosing.months.at(-1);
  const distributionPool = monthClosing.months.reduce(
    (s, m) => s + n(m.distributionAmount),
    0
  );

  const investorRows = investors.map((inv) => {
    const distTotal = inv.monthDistributions.reduce((s, d) => s + n(d.totalShare), 0);
    const pendingW = inv.withdrawals.filter((w) => w.status === 'PENDING');
    return {
      id: inv.id,
      name: inv.name,
      type: inv.type,
      walletBalance: n(inv.walletBalance),
      totalEarnings: n(inv.totalEarnings),
      totalWithdrawn: n(inv.totalWithdrawn),
      netContributed: n(inv.netContributed),
      currentShare: n(inv.currentShare),
      salaryShare: n(inv.salaryShare),
      cumulativeDistributions: Math.round(distTotal),
      pendingWithdrawals: pendingW.length,
      pendingWithdrawalAmount: Math.round(
        pendingW.reduce((s, w) => s + n(w.amount), 0)
      ),
      recentWithdrawals: inv.withdrawals.slice(0, 3).map((w) => ({
        id: w.id,
        amount: n(w.amount),
        status: w.status,
        createdAt: w.createdAt.toISOString(),
      })),
    };
  });

  return {
    totalWalletBalance: Math.round(totalWallet),
    totalEarnings: Math.round(totalEarnings),
    totalWithdrawn: Math.round(totalWithdrawn),
    totalContributed: Math.round(totalContributed),
    partnerCount: partnerInvestors.length,
    investorCount: equityInvestors.length,
    pendingWithdrawalCount: pendingWithdrawals._count ?? 0,
    pendingWithdrawalAmount: n(pendingWithdrawals._sum.amount),
    approvedWithdrawalTotal: n(approvedWithdrawalsFromCash._sum.amount),
    monthClosingCumulativeNet: monthClosing.cumulativeNetProfit,
    monthClosingCumulativeReinvest: monthClosing.cumulativeReinvestment,
    lastClosedMonth: lastClosed
      ? {
          month: lastClosed.month,
          year: lastClosed.year,
          netProfit: lastClosed.netProfit,
          distributionAmount: lastClosed.distributionAmount,
          reinvestmentAmount: lastClosed.reinvestmentAmount,
        }
      : null,
    cumulativeDistributionPool: Math.round(distributionPool),
    auditedNetProfitThisMonth: auditedMonth.netProfit,
    auditedRevenueThisMonth: auditedMonth.revenue,
    investors: investorRows,
    monthClosingChart: monthClosing.months.map((m) => ({
      label: `${m.month}/${m.year}`,
      netProfit: m.netProfit,
      distribution: m.distributionAmount,
    })),
  };
}

/** Customers — compare delivered vs financially audited revenue */
export async function getCustomersInsights() {
  const [deliveredAgg, auditedAgg, deliveredCount, auditedCount, codAudited] =
    await Promise.all([
      prisma.order.aggregate({
        where: { status: 'delivered' },
        _sum: { totalPrice: true },
        _avg: { totalPrice: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { status: 'delivered', isFinanciallyAudited: true },
        _sum: { totalPrice: true, netProfit: true },
        _avg: { totalPrice: true },
        _count: true,
      }),
      prisma.order.count({ where: { status: 'delivered' } }),
      prisma.order.count({
        where: { status: 'delivered', isFinanciallyAudited: true },
      }),
      prisma.order.aggregate({
        where: {
          status: 'delivered',
          isFinanciallyAudited: true,
          paymentMethod: 'cod',
        },
        _sum: { totalPrice: true },
        _count: true,
      }),
    ]);

  const deliveredRevenue = n(deliveredAgg._sum.totalPrice);
  const auditedRevenue = n(auditedAgg._sum.totalPrice);
  const notAuditedCount = deliveredCount - auditedCount;

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const deliveredMonthly = await prisma.order.findMany({
    where: { status: 'delivered', deliveredAt: { gte: sixMonthsAgo } },
    select: { deliveredAt: true, totalPrice: true, isFinanciallyAudited: true },
  });

  const monthMap = new Map<string, { delivered: number; audited: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, { delivered: 0, audited: 0 });
  }
  for (const o of deliveredMonthly) {
    if (!o.deliveredAt) continue;
    const key = `${o.deliveredAt.getFullYear()}-${String(o.deliveredAt.getMonth() + 1).padStart(2, '0')}`;
    const cur = monthMap.get(key);
    if (!cur) continue;
    cur.delivered += n(o.totalPrice);
    if (o.isFinanciallyAudited) cur.audited += n(o.totalPrice);
  }

  return {
    deliveredRevenue: Math.round(deliveredRevenue),
    auditedRevenue: Math.round(auditedRevenue),
    revenueNotInAudit: Math.round(deliveredRevenue - auditedRevenue),
    deliveredOrderCount: deliveredCount,
    auditedOrderCount: auditedCount,
    pendingAuditCount: Math.max(0, notAuditedCount),
    auditedNetProfit: Math.round(n(auditedAgg._sum.netProfit)),
    avgDeliveredOrder: Math.round(n(deliveredAgg._avg.totalPrice)),
    avgAuditedOrder: Math.round(n(auditedAgg._avg.totalPrice)),
    codAuditedRevenue: Math.round(n(codAudited._sum.totalPrice)),
    codAuditedCount: codAudited._count ?? 0,
    monthlyComparison: Array.from(monthMap.entries()).map(([month, v]) => ({
      month,
      delivered: Math.round(v.delivered),
      audited: Math.round(v.audited),
    })),
  };
}

export async function getFullMobileInsights(params: {
  startDate?: string | null;
  endDate?: string | null;
  month?: string | null;
  year?: string | null;
}) {
  const range = parseInsightsRange(
    params.startDate ?? null,
    params.endDate ?? null,
    params.month ?? null,
    params.year ?? null
  );

  const [
    treasury,
    cashFlow,
    auditedOrders,
    expenses,
    monthClosing,
    inventory,
    procurement,
    operationalOrders,
  ] = await Promise.all([
    getTreasuryInsights(),
    getCashFlowInsights(range),
    getAuditedOrdersInsights(range),
    getExpensesInsights(range),
    getMonthClosingInsights(),
    getInventoryInsights(),
    getProcurementInsights(),
    getOperationalOrdersInsights(range),
  ]);

  // Reconciliation hint: cash net vs audited revenue - expenses cash
  const impliedCashChange = auditedOrders.revenue - expenses.totalCashOut;
  const cashFlowDelta = cashFlow.periodNet - impliedCashChange;

  return {
    range: {
      start: range.start.toISOString(),
      end: range.end.toISOString(),
    },
    treasury,
    cashFlow,
    auditedOrders,
    expenses,
    monthClosing,
    inventory,
    procurement,
    operationalOrders,
    reconciliation: {
      auditedRevenue: auditedOrders.revenue,
      expenseCashOut: expenses.totalCashOut,
      impliedNet: Math.round(impliedCashChange),
      actualCashNet: cashFlow.periodNet,
      unexplainedGap: Math.round(cashFlowDelta),
      note:
        'Gap may include opening balance moves, month closing, transfers, or COD not yet collected.',
    },
  };
}
