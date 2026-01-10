import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { getInventoryForBalanceSheet } from '@/lib/services/inventoryValuationService';
import FinanceDashboardClient from './FinanceDashboardClient';

export const metadata: Metadata = {
  title: 'Finance Dashboard | Admin',
};

export const dynamic = 'force-dynamic';

// Get comprehensive finance statistics
async function getFinanceStats() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      treasuryAccounts,
      monthlyRevenue,
      lastMonthRevenue,
      monthlyExpenses,
      lastMonthExpenses,
      inventoryData,
      accountsReceivable,
      accountsPayable,
      capitalInvestors,
      pendingExpenses,
      revenueRecognition
    ] = await Promise.all([
      prisma.treasuryAccount.findMany(),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: monthStart },
          status: { in: ['Paid', 'Shipped', 'Delivered'] }
        },
        _sum: { totalPrice: true },
        _count: true
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
          status: { in: ['Paid', 'Shipped', 'Delivered'] }
        },
        _sum: { totalPrice: true }
      }),
      prisma.expense.aggregate({
        where: {
          date: { gte: monthStart },
          status: 'APPROVED'
        },
        _sum: { amount: true }
      }),
      prisma.expense.aggregate({
        where: {
          date: { gte: lastMonthStart, lte: lastMonthEnd },
          status: 'APPROVED'
        },
        _sum: { amount: true }
      }),
      getInventoryForBalanceSheet(),
      prisma.order.aggregate({
        where: {
          status: { in: ['Paid', 'Shipped'] },
          paymentMethod: 'cod'
        },
        _sum: { totalPrice: true }
      }),
      prisma.purchaseInvoice.aggregate({
        where: { status: { in: ['POSTED', 'APPROVED'] } },
        _sum: { remainingAmount: true }
      }),
      prisma.capitalTransaction.groupBy({
        by: ['investorId'],
        _sum: { amount: true }
      }),
      prisma.expense.count({
        where: { status: 'PENDING' }
      }),
      prisma.revenueRecognition.aggregate({
        where: { recognizedAt: { gte: monthStart } },
        _sum: { netRevenue: true, cogsAmount: true, grossProfit: true }
      })
    ]);

    const cashOnHand = treasuryAccounts.reduce((sum: number, acc) => sum + Number(acc.balance), 0);
    const revenue = Number(monthlyRevenue._sum?.totalPrice || 0);
    const lastRevenue = Number(lastMonthRevenue._sum?.totalPrice || 0);
    const expenses = Number(monthlyExpenses._sum?.amount || 0);
    const lastExpenses = Number(lastMonthExpenses._sum?.amount || 0);
    const cogs = Number(revenueRecognition._sum?.cogsAmount || 0);
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    
    const revenueTrend = lastRevenue > 0 ? ((revenue - lastRevenue) / lastRevenue) * 100 : 0;
    const expenseTrend = lastExpenses > 0 ? ((expenses - lastExpenses) / lastExpenses) * 100 : 0;
    const totalCapital = capitalInvestors.reduce((sum, inv) => sum + Number(inv._sum?.amount || 0), 0);

    return {
      cashOnHand,
      monthlyRevenue: revenue,
      orderCount: monthlyRevenue._count,
      revenueTrend,
      monthlyExpenses: expenses,
      expenseTrend,
      grossProfit,
      grossMargin,
      netProfit,
      netMargin,
      inventoryValue: inventoryData.bookValue,
      inventoryItems: inventoryData.totalSKUs,
      accountsReceivable: Number(accountsReceivable._sum?.totalPrice || 0),
      accountsPayable: Number(accountsPayable._sum?.remainingAmount || 0),
      totalCapital,
      investorCount: capitalInvestors.length,
      pendingExpenses,
      treasuryAccounts: treasuryAccounts.map(acc => ({
        name: acc.name,
        balance: Number(acc.balance),
        type: acc.type
      }))
    };
  } catch (error) {
    console.error('Failed to fetch finance stats:', error);
    return {
      cashOnHand: 0,
      monthlyRevenue: 0,
      orderCount: 0,
      revenueTrend: 0,
      monthlyExpenses: 0,
      expenseTrend: 0,
      grossProfit: 0,
      grossMargin: 0,
      netProfit: 0,
      netMargin: 0,
      inventoryValue: 0,
      inventoryItems: 0,
      accountsReceivable: 0,
      accountsPayable: 0,
      totalCapital: 0,
      investorCount: 0,
      pendingExpenses: 0,
      treasuryAccounts: []
    };
  }
}

export default async function FinanceDashboard() {
  const stats = await getFinanceStats();
  return <FinanceDashboardClient stats={stats} />;
}
