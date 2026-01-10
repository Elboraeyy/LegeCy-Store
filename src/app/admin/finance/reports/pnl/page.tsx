import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import PnLClient from './PnLClient';

export const metadata: Metadata = {
  title: 'Profit & Loss Report | Finance',
};

export const dynamic = 'force-dynamic';

// Get P&L data from orders (operational view)
async function getOperationalPnL(startDate: Date, endDate: Date) {
  // Get Revenue (all paid orders)
  const revenueData = await prisma.order.aggregate({
    where: {
      status: { in: ['Paid', 'Shipped', 'Delivered'] },
      createdAt: { gte: startDate, lte: endDate }
    },
    _sum: { totalPrice: true },
    _count: true
  });

  // Get Cost of Goods Sold (from order items with cost info)
  const ordersWithItems = await prisma.order.findMany({
    where: {
      status: { in: ['Paid', 'Shipped', 'Delivered'] },
      createdAt: { gte: startDate, lte: endDate }
    },
    include: {
      items: {
        include: {
          variant: true
        }
      }
    }
  });

  let cogs = 0;
  ordersWithItems.forEach(order => {
    order.items.forEach(item => {
      const cost = Number(item.variant?.costPrice || 0);
      cogs += cost * item.quantity;
    });
  });

  // Get Expenses
  const expensesData = await prisma.expense.aggregate({
    where: {
      date: { gte: startDate, lte: endDate },
      status: 'APPROVED'
    },
    _sum: { amount: true }
  });

  // Group expenses by category
  const expensesByCategory = await prisma.expense.groupBy({
    by: ['categoryId'],
    where: {
      date: { gte: startDate, lte: endDate },
      status: 'APPROVED'
    },
    _sum: { amount: true }
  });

  // Get category names
  const categoryIds = expensesByCategory.map(e => e.categoryId);
  const categories = await prisma.expenseCategory.findMany({
    where: { id: { in: categoryIds } }
  });

  const expensesBreakdown = expensesByCategory.map(e => ({
    category: categories.find(c => c.id === e.categoryId)?.name || 'Uncategorized',
    amount: Number(e._sum?.amount || 0)
  }));

  // Calculate metrics
  const revenue = Number(revenueData._sum?.totalPrice || 0);
  const grossProfit = revenue - cogs;
  const totalExpenses = Number(expensesData._sum?.amount || 0);
  const netProfit = grossProfit - totalExpenses;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return {
    revenue,
    cogs,
    grossProfit,
    totalExpenses,
    netProfit,
    grossMargin,
    netMargin,
    orderCount: revenueData._count,
    expensesBreakdown
  };
}

// Get P&L data from ledger accounts (accounting view - the source of truth)
async function getLedgerBasedPnL() {
  const revenueAccounts = await prisma.account.findMany({
    where: { type: 'REVENUE' }
  });
  const ledgerRevenue = revenueAccounts.reduce((sum: number, acc: { balance: unknown }) => sum + Number(acc.balance), 0);
  
  const cogsAccount = await prisma.account.findFirst({
    where: { code: '5000' }
  });
  const ledgerCOGS = Number(cogsAccount?.balance || 0);

  const expenseAccounts = await prisma.account.findMany({
    where: { 
      type: 'EXPENSE',
      code: { not: '5000' }
    }
  });
  const ledgerExpenses = expenseAccounts.reduce((sum: number, acc: { balance: unknown }) => sum + Number(acc.balance), 0);

  const ledgerGrossProfit = ledgerRevenue - ledgerCOGS;
  const ledgerNetProfit = ledgerGrossProfit - ledgerExpenses;

  const recognizedRevenue = await prisma.revenueRecognition.aggregate({
    _sum: { netRevenue: true, cogsAmount: true, grossProfit: true },
    _count: true
  });

  return {
    ledgerRevenue,
    ledgerCOGS,
    ledgerExpenses,
    ledgerGrossProfit,
    ledgerNetProfit,
    recognizedOrders: recognizedRevenue._count,
    recognizedRevenue: Number(recognizedRevenue._sum?.netRevenue || 0),
    recognizedCOGS: Number(recognizedRevenue._sum?.cogsAmount || 0),
    recognizedProfit: Number(recognizedRevenue._sum?.grossProfit || 0)
  };
}

export default async function ProfitLossPage({ searchParams }: { searchParams: { period?: string } }) {
  const now = new Date();
  const period = searchParams.period || 'month';
  
  let startDate: Date;
  let endDate: Date = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  switch (period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }
  
  const data = await getOperationalPnL(startDate, endDate);
  const ledger = await getLedgerBasedPnL();

  const periodLabel = `${startDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} - ${endDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;

  return (
    <PnLClient 
      data={data} 
      ledger={ledger} 
      period={period} 
      periodLabel={periodLabel} 
    />
  );
}
