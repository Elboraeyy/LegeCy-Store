'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/guards';
import { Prisma } from '@prisma/client';

// --------------------------------------------------------
// Types & Enums
// --------------------------------------------------------
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface JournalLineInput {
  accountId: string;
  debit?: number;
  credit?: number;
  description?: string;
}

// --------------------------------------------------------
// 1. Chart of Accounts Management
// --------------------------------------------------------

export async function getAccounts() {
  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  });
  return accounts;
}

export async function createAccount(data: { name: string; type: AccountType; code: string; description?: string }) {
  await requireAdmin();

  const account = await prisma.account.create({
    data: {
      ...data,
      balance: 0,
      isSystem: false,
      // createdBy: admin.id, // Removed as it is not in Account model
    },
  });

  revalidatePath('/admin/finance/accounts');
  return account;
}

// --------------------------------------------------------
// 2. Ledger Core (Journal Entries)
// --------------------------------------------------------

/**
 * ATOMIC LEDGER TRANSACTION
 * This is the SINGLE point of truth for all money movement.
 * It ensures Debit == Credit and updates Account Balances atomically.
 */
export async function createJournalEntry(
  description: string,
  lines: JournalLineInput[],
  reference?: string,
  metadata?: { orderId?: string; expenseId?: string; capitalTxId?: string }
) {
  const admin = await requireAdmin();

  // 0. Enforce Financial Period Locking
  const entryDate = new Date();
  const closedPeriod = await prisma.financialPeriod.findFirst({
    where: {
      startDate: { lte: entryDate },
      endDate: { gte: entryDate },
      status: 'CLOSED'
    }
  });

  if (closedPeriod) {
    throw new Error(`Financial Period is CLOSED for date ${entryDate.toISOString().split('T')[0]}. No new entries allowed.`);
  }

  // 1. Validate Balance (Zero-Sum Check) using EXACT decimal math
  // CRITICAL: Never use floating-point tolerance for financial calculations
  const { Decimal } = await import('@prisma/client/runtime/library');
  
  let totalDebit = new Decimal(0);
  let totalCredit = new Decimal(0);

  lines.forEach(line => {
    totalDebit = totalDebit.plus(new Decimal(line.debit || 0));
    totalCredit = totalCredit.plus(new Decimal(line.credit || 0));
  });

  // EXACT equality check - no tolerance
  if (!totalDebit.equals(totalCredit)) {
    throw new Error(`Journal Entry Unbalanced: Debit (${totalDebit.toString()}) != Credit (${totalCredit.toString()})`);
  }

  // 2. Execute Atomic Transaction
  const entry = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // A. Create The Journal Header
    const journal = await tx.journalEntry.create({
      data: {
        description,
        reference,
        date: new Date(),
        status: 'POSTED',
        createdBy: admin.id,
        ...metadata,
      },
    });

    // B. Create Lines & Update Account Balances
    for (const line of lines) {
      const debit = line.debit || 0;
      const credit = line.credit || 0;

      await tx.transactionLine.create({
        data: {
          journalEntryId: journal.id,
          accountId: line.accountId,
          debit,
          credit,
          description: line.description || description,
        },
      });

      // Update Cached Account Balance (Assets/Expenses increase with Debit, others with Credit)
      // Note: This is a simplified view. True accounting usually stores balance as Dr-Cr.
      // Here: Balance = Dr - Cr for Asset/Expense. Balance = Cr - Dr for others.
      const account = await tx.account.findUnique({ where: { id: line.accountId } });
      if (account) {
        let balanceChange = 0;
        if (['ASSET', 'EXPENSE'].includes(account.type)) {
            balanceChange = debit - credit;
        } else {
            balanceChange = credit - debit;
        }

        await tx.account.update({
          where: { id: line.accountId },
          data: { balance: { increment: balanceChange } },
        });
      }
    }

    return journal;
  });

  revalidatePath('/admin/finance');
  return entry;
}

// --------------------------------------------------------
// 3. Capital Management (Investors)
// --------------------------------------------------------

export async function getInvestors() {
  const investors = await prisma.investor.findMany({
    orderBy: { currentShare: 'desc' },
  });
  
  // Transform Decimal to number for Client Components
  return investors.map(inv => ({
    ...inv,
    netContributed: Number(inv.netContributed),
    currentShare: Number(inv.currentShare),
    joinedAt: inv.joinedAt, // Keep Date
  }));
}

export async function addCapital(investorId: string, amount: number, description: string) {
    const admin = await requireAdmin();
  
    // 1. Get Accounts (Assuming System Accounts exist - we will need a seed script)
    const cashAccount = await prisma.account.findFirst({ where: { code: '1001' } }); // Cash
    const equityAccount = await prisma.account.findFirst({ where: { code: '3001' } }); // General Equity or Investor Account
  
    if (!cashAccount || !equityAccount) throw new Error('System Accounts (Cash/Equity) not found. Please Run Setup.');
  
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Record Capital Transaction
      const capitalTx = await tx.capitalTransaction.create({
        data: {
          investorId,
          type: 'DEPOSIT',
          amount,
          description,
          createdBy: admin.id,
        },
      });
  
      // 2. Update Personal Net Contributed
      await tx.investor.update({
        where: { id: investorId },
        data: { netContributed: { increment: amount } }
      });
  
      // 3. Recalculate Global Equity Shares (Dynamic)
      const allInvestors = await tx.investor.findMany();
      const totalCapital = allInvestors.reduce((sum: number, inv) => sum + Number(inv.netContributed), 0);
  
      if (totalCapital > 0) {
        for (const inv of allInvestors) {
          const share = (Number(inv.netContributed) / totalCapital) * 100;
          await tx.investor.update({
            where: { id: inv.id },
            data: { currentShare: share }
          });
        }
      }
  
      // 4. Create Financial Journal Entry
      // Dr Cash, Cr Equity
      // We can't use the createJournalEntry helper easily inside a transaction without passing tx, 
      // so we inline the create logic or Refactor createJournalEntry to accept tx.
      // For now, we manually create to ensure atomicity.
      
      const journal = await tx.journalEntry.create({
        data: {
            description: `Capital Injection: ${description}`,
            capitalTxId: capitalTx.id,
            createdBy: admin.id,
            date: new Date(),
            status: 'POSTED'
        }
      });

      // Line 1: Debit Cash
      await tx.transactionLine.create({
        data: {
            journalEntryId: journal.id,
            accountId: cashAccount.id,
            debit: amount,
            credit: 0
        }
      });
      await tx.account.update({ where: { id: cashAccount.id }, data: { balance: { increment: amount } }});

      // Line 2: Credit Equity
      await tx.transactionLine.create({
        data: {
            journalEntryId: journal.id,
            accountId: equityAccount.id,
            debit: 0,
            credit: amount
        }
      });
      await tx.account.update({ where: { id: equityAccount.id }, data: { balance: { increment: amount } }});
    });
  
    revalidatePath('/admin/finance/capital');
  }

export async function withdrawCapital(investorId: string, amount: number, description: string) {
    const admin = await requireAdmin();
  
    const cashAccount = await prisma.account.findFirst({ where: { code: '1001' } }); // Cash
    const equityAccount = await prisma.account.findFirst({ where: { code: '3001' } }); // General Equity
  
    if (!cashAccount || !equityAccount) throw new Error('System Accounts not found');
  
    // Check if enough cash (Optional, but good practice)
    if (Number(cashAccount.balance) < amount) {
        throw new Error('Insufficient Cash on Hand for Withdrawal');
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Record Capital Transaction
      const capitalTx = await tx.capitalTransaction.create({
        data: {
          investorId,
          type: 'WITHDRAWAL',
          amount,
          description,
          createdBy: admin.id,
        },
      });
  
      // 2. Update Personal Net Contributed (Decrease)
      await tx.investor.update({
        where: { id: investorId },
        data: { netContributed: { decrement: amount } }
      });
  
      // 3. Recalculate Global Equity Shares
      const allInvestors = await tx.investor.findMany();
      const totalCapital = allInvestors.reduce((sum: number, inv) => sum + Number(inv.netContributed), 0);
  
      if (totalCapital > 0) {
        for (const inv of allInvestors) {
          const share = (Number(inv.netContributed) / totalCapital) * 100;
          await tx.investor.update({
            where: { id: inv.id },
            data: { currentShare: share }
          });
        }
      }
  
      // 4. Create Financial Journal Entry
      // Dr Equity, Cr Cash
      const journal = await tx.journalEntry.create({
        data: {
            description: `Capital Withdrawal: ${description}`,
            capitalTxId: capitalTx.id,
            createdBy: admin.id,
            date: new Date(),
            status: 'POSTED'
        }
      });

      // Line 1: Debit Equity (Equity decreases with Debit)
      await tx.transactionLine.create({
        data: {
            journalEntryId: journal.id,
            accountId: equityAccount.id,
            debit: amount,
            credit: 0
        }
      });
      await tx.account.update({ where: { id: equityAccount.id }, data: { balance: { decrement: amount } }});

      // Line 2: Credit Cash (Asset decreases with Credit)
      await tx.transactionLine.create({
        data: {
            journalEntryId: journal.id,
            accountId: cashAccount.id,
            debit: 0,
            credit: amount
        }
      });
      await tx.account.update({ where: { id: cashAccount.id }, data: { balance: { decrement: amount } }});
    });
  
    revalidatePath('/admin/finance/capital');
}

// --------------------------------------------------------
// 4. Reporting & Dashboard
// --------------------------------------------------------

// --------------------------------------------------------
// 4. Reporting & Dashboard (Advanced)
// --------------------------------------------------------

/**
 * Helper: Get net flow for account type in a date range
 */
async function getFlowByType(type: AccountType, startDate: Date, endDate: Date) {
  const result = await prisma.transactionLine.aggregate({
    where: {
      account: { type },
      journalEntry: {
        date: { gte: startDate, lte: endDate },
        status: 'POSTED'
      }
    },
    _sum: { debit: true, credit: true }
  });

  const debit = Number(result._sum.debit || 0);
  const credit = Number(result._sum.credit || 0);

  // For Revenue/Equity/Liabilities: Credit is positive flow
  // For Asset/Expense: Debit is positive flow
  if (type === 'ASSET' || type === 'EXPENSE') {
    return debit - credit;
  }
  return credit - debit;
}

export async function getIncomeStatement(startDate?: Date, endDate?: Date) {
  const start = startDate || new Date(new Date().getFullYear(), 0, 1); // Jan 1st
  const end = endDate || new Date();

  const revenue = await getFlowByType('REVENUE', start, end);
  const expense = await getFlowByType('EXPENSE', start, end);

  // Create detailed breakdown
  const expenseCategories = await prisma.account.findMany({
    where: { type: 'EXPENSE' },
    select: { id: true, name: true, code: true }
  });

  const breakdown = [];
  for (const acc of expenseCategories) {
    const flow = await prisma.transactionLine.aggregate({
      where: {
        accountId: acc.id,
        journalEntry: { date: { gte: start, lte: end }, status: 'POSTED' }
      },
      _sum: { debit: true, credit: true }
    });
    const amount = Number(flow._sum.debit || 0) - Number(flow._sum.credit || 0);
    if (amount !== 0) {
      breakdown.push({ name: acc.name, code: acc.code, amount });
    }
  }

  return {
    period: { start, end },
    revenue,
    cogs: 0, // TODO: Separate COGS from regular expenses using account codes (e.g. 5000-5999)
    grossProfit: revenue, // - cogs
    expenses: expense,
    netIncome: revenue - expense,
    breakdown: breakdown.sort((a, b) => b.amount - a.amount)
  };
}

export async function getBalanceSheet() {
  // Balance Sheet is Point-in-Time, so we use current Account Balances
  const accounts = await prisma.account.findMany({
    orderBy: { code: 'asc' }
  });

  const assets = accounts.filter(a => a.type === 'ASSET');
  const liabilities = accounts.filter(a => a.type === 'LIABILITY');
  const equity = accounts.filter(a => a.type === 'EQUITY');

  const totalAssets = assets.reduce((sum, a) => sum + Number(a.balance), 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + Number(a.balance), 0);
  const totalEquity = equity.reduce((sum, a) => sum + Number(a.balance), 0);

  // Calculate Retained Earnings (Net Profit since beginning of time potentially, or managed via Closing entries)
  // For simplicity here, verification: Assets = Liab + Equity
  const check = totalAssets - (totalLiabilities + totalEquity);

  return {
    assets: { total: totalAssets, items: assets.map(a => ({ ...a, balance: Number(a.balance) })) },
    liabilities: { total: totalLiabilities, items: liabilities.map(a => ({ ...a, balance: Number(a.balance) })) },
    equity: { total: totalEquity, items: equity.map(a => ({ ...a, balance: Number(a.balance) })) },
    check: check // Should be 0
  };
}

export async function getFinancialMetrics() {
  // Quick Dashboard Summary
  const bs = await getBalanceSheet();
  const income = await getIncomeStatement(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1), // This Month
    new Date()
  );

  return {
    assets: bs.assets.total,
    liabilities: bs.liabilities.total,
    equity: bs.equity.total,
    revenue: income.revenue,
    expenses: income.expenses,
    netProfit: income.netIncome,
    cashOnHand: bs.assets.items.filter(a => a.code === '1001').reduce((s, a) => s + a.balance, 0)
    };
}

// --------------------------------------------------------
// 5. Expense Management
// --------------------------------------------------------

export async function getExpenses() {
  const expenses = await prisma.expense.findMany({
    include: { category: true },
    orderBy: { date: 'desc' },
  });

  return expenses.map(e => ({
    ...e,
    amount: Number(e.amount),
    // Ensure all other fields match expected interfaces
  }));
}

export async function getExpenseCategories() {
  return await prisma.expenseCategory.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function createExpenseCategory(name: string, budgetLimit?: number) {
  await requireAdmin();

  const category = await prisma.expenseCategory.create({
    data: { name, budgetLimit }, // budgetLimit not strictly required by everyone but kept
  });
  
  revalidatePath('/admin/finance/expenses');
  return category;
}

export async function createExpense(data: { description: string; amount: number; categoryId: string; date?: Date; vaultId?: string }) {
  const admin = await requireAdmin();
  if(!admin) throw new Error('Unauthorized'); // Use admin variable explicitly

  // Get vault (default to 1001 Cash if not specified)
  let cashAccount = null;
  if (data.vaultId) {
    cashAccount = await prisma.account.findUnique({ where: { id: data.vaultId } });
  }
  if (!cashAccount) {
    cashAccount = await prisma.account.findFirst({ where: { code: '1001' } }); // Cash
  }
  if (!cashAccount) throw new Error('Cash Account (1001) not found');

  // Find or determine the expense account
  const category = await prisma.expenseCategory.findUnique({ where: { id: data.categoryId } });
  let expenseAccount = await prisma.account.findFirst({ where: { name: category?.name, type: 'EXPENSE' } });
  
  if (!expenseAccount) {
    // Fallback to General Expenses
    expenseAccount = await prisma.account.findFirst({ where: { code: '5999' } });
  }
  if (!expenseAccount) throw new Error('Expense Account not found');

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Create Expense Record
    const expense = await tx.expense.create({
      data: {
        amount: data.amount,
        description: data.description,
        categoryId: data.categoryId,
        date: data.date || new Date(),
        status: 'PAID', // Assume immediate payment for now (Cash Basin)
        approvedBy: admin.id,
        paidBy: cashAccount!.name,
      },
    });

    // 2. Create Journal Entry (Dr Expense, Cr Vault)
    const journal = await tx.journalEntry.create({
      data: {
        description: `Expense: ${data.description}`,
        expenseId: expense.id,
        createdBy: admin.id,
        date: data.date || new Date(),
        status: 'POSTED',
      },
    });

    // Line 1: Debit Expense Account
    await tx.transactionLine.create({
      data: {
        journalEntryId: journal.id,
        accountId: expenseAccount!.id,
        debit: data.amount,
        credit: 0
      }
    });
    // Update Expense Account Balance
    await tx.account.update({ 
        where: { id: expenseAccount!.id }, 
        data: { balance: { increment: data.amount } } 
    });

    // Line 2: Credit Vault Account
    await tx.transactionLine.create({
      data: {
        journalEntryId: journal.id,
        accountId: cashAccount!.id,
        debit: 0,
        credit: data.amount
      }
    });
    // Update Vault Account Balance (Asset decreases with Credit)
    await tx.account.update({ 
        where: { id: cashAccount!.id }, 
        data: { balance: { decrement: data.amount } } 
    });

    // Link Journal to Expense
    await tx.expense.update({
        where: { id: expense.id },
        data: { journalEntryId: journal.id }
    });
  });

  revalidatePath('/admin/finance/expenses');
  revalidatePath('/admin/finance/treasury');
  revalidatePath('/admin/finance'); // Dashboard updates too
}

// --------------------------------------------------------
// 6. Ledger / Transactions Viewer
// --------------------------------------------------------

export async function getJournalEntries() {
  const entries = await prisma.journalEntry.findMany({
    include: {
      lines: {
        include: { account: true }
      }
    },
    orderBy: { date: 'desc' },
  });

  // Transform Decimals to numbers
  return entries.map(entry => ({
    ...entry,
    lines: entry.lines.map(line => ({
      ...line,
      debit: Number(line.debit),
      credit: Number(line.credit),
    }))
  }));
}

// --------------------------------------------------------
// 7. Inventory Valuation
// --------------------------------------------------------

export async function getInventoryValuation() {
  const variants = await prisma.variant.findMany({
    include: {
      product: {
        select: {
          id: true,
          name: true,
          costPrice: true,
          compareAtPrice: true,
          categoryRel: { select: { name: true } }
        }
      },
      inventory: true
    }
  });

  let totalAssetValue = 0; // Cost Basis
  let totalPotentialRevenue = 0; // Retail Value
  let totalItems = 0;

  const valuationItems = variants.map((variant) => {
    const totalQty = variant.inventory.reduce((sum: number, inv) => sum + inv.available, 0);
    const cost = Number(variant.product.costPrice) || 0;
    const price = Number(variant.price);
    
    const assetValue = totalQty * cost;
    const revenueValue = totalQty * price;

    totalAssetValue += assetValue;
    totalPotentialRevenue += revenueValue;
    totalItems += totalQty;

    return {
      sku: variant.sku,
      productName: variant.product.name,
      category: variant.product.categoryRel?.name ?? 'Uncategorized',
      qty: totalQty,
      costUnit: cost,
      priceUnit: price,
      totalCost: assetValue,
      totalRevenue: revenueValue,
      margin: revenueValue - assetValue
    };
  }).filter((item) => item.qty > 0);

  return {
    summary: {
      totalAssetValue,
      totalPotentialRevenue,
      totalItems,
      potentialProfit: totalPotentialRevenue - totalAssetValue
    },
    items: valuationItems.sort((a, b) => b.totalCost - a.totalCost)
  };
}

// --------------------------------------------------------
// 8. System Actions (Internal Use)
// --------------------------------------------------------

export async function recordOrderRevenue(orderId: string, amount: number) {
  // 1. Get Accounts (Sales Revenue & Cash/Bank)
  // Assuming 4001 is Sales Revenue, 1001 is Cash.
  // In a real system, we might check Payment Method to decide 1001 (Cash) vs 1002 (Bank).
  // For now, let's assume Cash for simplicity or look up by logic.
  
  const salesAccount = await prisma.account.findFirst({ where: { code: '4001' } });
  const cashAccount = await prisma.account.findFirst({ where: { code: '1001' } });

  if (!salesAccount || !cashAccount) {
    console.error('Missing System Accounts for Revenue Recording');
    return;
  }

  // Idempotency Check: Don't record if already exists
  const existing = await prisma.journalEntry.findFirst({ where: { orderId } });
  if (existing) return;

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // A. Create Journal Header
    const journal = await tx.journalEntry.create({
      data: {
        description: `Revenue from Order #${orderId.slice(0,8)}`,
        reference: orderId,
        date: new Date(),
        status: 'POSTED',
        createdBy: 'SYSTEM', // System Action
        orderId: orderId
      },
    });

    // B. Line 1: Debit Cash (Asset increases)
    await tx.transactionLine.create({
      data: {
        journalEntryId: journal.id,
        accountId: cashAccount.id,
        debit: amount,
        credit: 0,
        description: 'Order Payment Received'
      }
    });
    await tx.account.update({
        where: { id: cashAccount.id },
        data: { balance: { increment: amount } }
    });

    // C. Line 2: Credit Sales Revenue (Income increases)
    await tx.transactionLine.create({
      data: {
        journalEntryId: journal.id,
        accountId: salesAccount.id,
        debit: 0,
        credit: amount,
        description: 'Sales Revenue'
      }
    });
    await tx.account.update({
        where: { id: salesAccount.id },
        data: { balance: { increment: amount } }
    });
  });
  
  revalidatePath('/admin/finance');
}



// --------------------------------------------------------
// 9. Accounts Receivable (AR) Aging
// --------------------------------------------------------

export async function getARAging() {
  // Find orders that are confirmed/delivered but not fully paid
  const unpaidOrders = await prisma.order.findMany({
    where: {
      status: { in: ['payment_pending', 'pending'] },
      paymentMethod: { not: 'cod' }
    },
    select: {
      id: true,
      createdAt: true,
      totalPrice: true,
      customerName: true
    }
  });

  const aging = {
    '0-30': 0,
    '31-60': 0,
    '61-90': 0,
    '90+': 0,
    total: 0
  };

  const now = new Date();

  for (const order of unpaidOrders) {
    const ageInDays = Math.floor((now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const amount = Number(order.totalPrice);

    if (ageInDays <= 30) aging['0-30'] += amount;
    else if (ageInDays <= 60) aging['31-60'] += amount;
    else if (ageInDays <= 90) aging['61-90'] += amount;
    else aging['90+'] += amount;

    aging.total += amount;
  }

  return aging;
}

// --------------------------------------------------------
// 10. Trial Balance & Tax
// --------------------------------------------------------

export async function getTaxReport(startDate: Date, endDate: Date) {
  // 1. Sales Tax (Output VAT) - Credit on Tax Account
  // 2. Purchase Tax (Input VAT) - Debit on Tax Account
  // Net Tax = Output - Input

  // We need to find the Tax Account (e.g. 2002 Sales Tax Payable)
  const taxAccount = await prisma.account.findFirst({ where: { code: '2002' } }); // Example code

  if (!taxAccount) return { error: 'Tax account not configured' };

  const txs = await prisma.transactionLine.groupBy({
    by: ['journalEntryId'],
    where: {
      accountId: taxAccount.id,
      journalEntry: {
        date: { gte: startDate, lte: endDate },
        status: 'POSTED'
      }
    },
    _sum: { debit: true, credit: true }
  });

  let totalInputTax = 0; // Dr
  let totalOutputTax = 0; // Cr

  for (const t of txs) {
    totalInputTax += Number(t._sum.debit || 0);
    totalOutputTax += Number(t._sum.credit || 0);
  }

  return {
    period: { start: startDate, end: endDate },
    totalOutputTax,
    totalInputTax,
    netPayable: totalOutputTax - totalInputTax
  };
}

// --------------------------------------------------------
// 10. Trial Balance
// --------------------------------------------------------

export async function getTrialBalance() {
  const accounts = await prisma.account.findMany({
    orderBy: { code: 'asc' }
  });

  let totalDebit = 0;
  let totalCredit = 0;

  const lines = accounts.map(acc => {
    const balance = Number(acc.balance);
    const type = acc.type;
    let debit = 0;
    let credit = 0;

    // Normal Balance Logic:
    // Asset/Expense: Debit Normal. Positive balance = Debit. Negative = Credit.
    // Liability/Equity/Revenue: Credit Normal. Positive balance = Credit. Negative = Debit.

    if (['ASSET', 'EXPENSE'].includes(type)) {
      if (balance >= 0) debit = balance;
      else credit = Math.abs(balance);
    } else {
      if (balance >= 0) credit = balance;
      else debit = Math.abs(balance);
    }

    totalDebit += debit;
    totalCredit += credit;

    return {
      code: acc.code,
      name: acc.name,
      type: acc.type,
      debit,
      credit
    };
  });

  return {
    asOf: new Date(),
    lines,
    totals: {
      debit: totalDebit,
      credit: totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
    }
  };
}
