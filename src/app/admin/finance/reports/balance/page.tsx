import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { getInventoryForBalanceSheet } from '@/lib/services/inventoryValuationService';
import BalanceSheetClient from './BalanceSheetClient';

export const metadata: Metadata = {
  title: 'Balance Sheet | Finance',
};

export const dynamic = 'force-dynamic';

// Operational Balance Sheet (from order/transaction data)
async function getOperationalBalanceSheet() {
  const treasuryAccounts = await prisma.treasuryAccount.findMany();
  const cashBalance = treasuryAccounts.reduce((sum: number, acc) => sum + Number(acc.balance), 0);

  const accountsReceivable = await prisma.order.aggregate({
    where: {
      status: { in: ['Paid', 'Shipped'] },
      paymentMethod: 'cod'
    },
    _sum: { totalPrice: true }
  });

  const inventoryData = await getInventoryForBalanceSheet();
  const inventoryTotal = inventoryData.bookValue;

  const accountsPayable = await prisma.purchaseInvoice.aggregate({
    where: {
      status: { in: ['POSTED', 'APPROVED'] }
    },
    _sum: { remainingAmount: true }
  });

  const netPayable = Number(accountsPayable._sum?.remainingAmount || 0);

  const customerDeposits = await prisma.order.aggregate({
    where: {
      status: { in: ['Paid', 'Shipped'] },
      paymentMethod: { not: 'cod' }
    },
    _sum: { totalPrice: true }
  });

  const totalRevenue = await prisma.order.aggregate({
    where: { status: { in: ['Paid', 'Shipped', 'Delivered'] } },
    _sum: { totalPrice: true }
  });

  const totalExpenses = await prisma.expense.aggregate({
    where: { status: 'APPROVED' },
    _sum: { amount: true }
  });

  const retainedEarnings = Number(totalRevenue._sum?.totalPrice || 0) - Number(totalExpenses._sum?.amount || 0);

  const totalAssets = cashBalance + Number(accountsReceivable._sum?.totalPrice || 0) + inventoryTotal;
  const totalLiabilities = Math.max(0, netPayable) + Number(customerDeposits._sum?.totalPrice || 0);
  const totalEquity = retainedEarnings;

  return {
    assets: {
      cash: cashBalance,
      accountsReceivable: Number(accountsReceivable._sum?.totalPrice || 0),
      inventory: inventoryTotal,
      total: totalAssets
    },
    liabilities: {
      accountsPayable: Math.max(0, netPayable),
      customerDeposits: Number(customerDeposits._sum?.totalPrice || 0),
      total: totalLiabilities
    },
    equity: {
      retainedEarnings: retainedEarnings,
      total: totalEquity
    },
    balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1
  };
}

// Ledger-based Balance Sheet
async function getLedgerBalanceSheet() {
  const accounts = await prisma.account.findMany();
  
  type AccountRecord = { id: string; code: string; name: string; type: string; balance: unknown };
  const assetAccounts = accounts.filter((a: AccountRecord) => a.type === 'ASSET');
  const liabilityAccounts = accounts.filter((a: AccountRecord) => a.type === 'LIABILITY');
  const equityAccounts = accounts.filter((a: AccountRecord) => a.type === 'EQUITY');
  const revenueAccounts = accounts.filter((a: AccountRecord) => a.type === 'REVENUE');
  const expenseAccounts = accounts.filter((a: AccountRecord) => a.type === 'EXPENSE');

  const totalAssets = assetAccounts.reduce((sum: number, a: AccountRecord) => sum + Number(a.balance), 0);
  const totalLiabilities = liabilityAccounts.reduce((sum: number, a: AccountRecord) => sum + Number(a.balance), 0);
  const totalEquity = equityAccounts.reduce((sum: number, a: AccountRecord) => sum + Number(a.balance), 0);
  const totalRevenue = revenueAccounts.reduce((sum: number, a: AccountRecord) => sum + Number(a.balance), 0);
  const totalExpenses = expenseAccounts.reduce((sum: number, a: AccountRecord) => sum + Number(a.balance), 0);
  const retainedEarnings = totalRevenue - totalExpenses;

  return {
    assets: { total: totalAssets },
    liabilities: { total: totalLiabilities },
    equity: { total: totalEquity + retainedEarnings }
  };
}

export default async function BalanceSheetPage() {
  const data = await getOperationalBalanceSheet();
  const ledger = await getLedgerBalanceSheet();

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <BalanceSheetClient 
      data={data} 
      ledger={ledger} 
      today={today}
    />
  );
}
