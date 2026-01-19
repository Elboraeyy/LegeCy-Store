'use server';

/**
 * Trial Balance Service
 * 
 * Generates trial balance reports for financial verification.
 * Critical for ensuring debits = credits (double-entry integrity).
 */

import prisma from '@/lib/prisma';

export interface TrialBalanceEntry {
  accountCode: string;
  accountName: string;
  accountType: string;
  debitBalance: number;
  creditBalance: number;
}

export interface TrialBalanceReport {
  entries: TrialBalanceEntry[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  variance: number;
  generatedAt: Date;
  periodStart?: Date;
  periodEnd?: Date;
}

/**
 * Generate a trial balance report
 * @param asOfDate Optional date to generate report as of (defaults to now)
 */
export async function generateTrialBalance(asOfDate?: Date): Promise<TrialBalanceReport> {
  const cutoffDate = asOfDate || new Date();
  
  // Get all accounts with their transaction lines
  const accounts = await prisma.account.findMany({
    include: {
      transactions: {
        where: {
          journalEntry: {
            date: { lte: cutoffDate },
            status: 'POSTED'
          }
        },
        select: {
          debit: true,
          credit: true
        }
      }
    },
    orderBy: { code: 'asc' }
  });

  const entries: TrialBalanceEntry[] = [];
  let totalDebits = 0;
  let totalCredits = 0;

  for (const account of accounts) {
    // Calculate total debits and credits for this account
    let accountDebits = 0;
    let accountCredits = 0;
    
    for (const txn of account.transactions) {
      accountDebits += Number(txn.debit);
      accountCredits += Number(txn.credit);
    }

    // For asset and expense accounts, debit balance is normal (debits - credits)
    // For liability, equity, and revenue accounts, credit balance is normal
    const netDebit = accountDebits - accountCredits;
    const debitBalance = netDebit > 0 ? netDebit : 0;
    const creditBalance = netDebit < 0 ? Math.abs(netDebit) : 0;

    entries.push({
      accountCode: account.code,
      accountName: account.name,
      accountType: account.type,
      debitBalance,
      creditBalance
    });

    totalDebits += debitBalance;
    totalCredits += creditBalance;
  }

  const variance = Math.abs(totalDebits - totalCredits);
  const isBalanced = variance < 0.01; // Allow for floating point rounding

  return {
    entries,
    totalDebits,
    totalCredits,
    isBalanced,
    variance,
    generatedAt: new Date(),
    periodEnd: cutoffDate
  };
}

/**
 * Verify trial balance is in balance
 * Returns true if debits = credits, false otherwise
 */
export async function verifyTrialBalance(): Promise<{
  isBalanced: boolean;
  variance: number;
  message: string;
}> {
  const report = await generateTrialBalance();
  
  if (report.isBalanced) {
    return {
      isBalanced: true,
      variance: 0,
      message: `Trial balance is in balance. Total: ${report.totalDebits.toFixed(2)} EGP`
    };
  }

  return {
    isBalanced: false,
    variance: report.variance,
    message: `Trial balance is OUT OF BALANCE! Debits: ${report.totalDebits.toFixed(2)}, Credits: ${report.totalCredits.toFixed(2)}, Variance: ${report.variance.toFixed(2)} EGP`
  };
}

/**
 * Get account balances summary for dashboard
 */
export async function getAccountsSummary() {
  const accounts = await prisma.account.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      balance: true
    },
    orderBy: { code: 'asc' }
  });

  // Group by type
  const summary = {
    assets: accounts.filter(a => a.type === 'ASSET').map(a => ({ ...a, balance: Number(a.balance) })),
    liabilities: accounts.filter(a => a.type === 'LIABILITY').map(a => ({ ...a, balance: Number(a.balance) })),
    equity: accounts.filter(a => a.type === 'EQUITY').map(a => ({ ...a, balance: Number(a.balance) })),
    revenue: accounts.filter(a => a.type === 'REVENUE').map(a => ({ ...a, balance: Number(a.balance) })),
    expenses: accounts.filter(a => a.type === 'EXPENSE').map(a => ({ ...a, balance: Number(a.balance) })),
    totalAssets: accounts.filter(a => a.type === 'ASSET').reduce((sum, a) => sum + Number(a.balance), 0),
    totalLiabilities: accounts.filter(a => a.type === 'LIABILITY').reduce((sum, a) => sum + Number(a.balance), 0),
    totalEquity: accounts.filter(a => a.type === 'EQUITY').reduce((sum, a) => sum + Number(a.balance), 0),
    totalRevenue: accounts.filter(a => a.type === 'REVENUE').reduce((sum, a) => sum + Number(a.balance), 0),
    totalExpenses: accounts.filter(a => a.type === 'EXPENSE').reduce((sum, a) => sum + Number(a.balance), 0)
  };

  return summary;
}
