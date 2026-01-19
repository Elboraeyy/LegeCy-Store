'use server';

import prisma from '@/lib/prisma';
import { FinancialPeriod } from '@prisma/client';

export type PeriodStatus = 'open' | 'closing' | 'closed' | 'locked';

/**
 * Financial Period Service
 * 
 * Enforces accounting discipline by managing financial periods.
 * - Prevents modification of closed periods.
 * - Generates period snapshots.
 * - Validates transaction dates.
 */

/**
 * Checks if a date falls within an open financial period.
 * Throws an error or returns false if the period is closed.
 */
export async function validateTransactionDate(date: Date): Promise<boolean> {
  const period = await prisma.financialPeriod.findFirst({
    where: {
      startDate: { lte: date },
      endDate: { gte: date }
    }
  });

  // If no period exists, we assume it's open (or we need to auto-create one)
  // For strict mode, we might want to require a period to exist.
  // For now, only block if a CLOSED period exists.
  
  if (period && (period.status === 'closed' || period.status === 'locked')) {
    return false;
  }
  
  return true;
}

/**
 * Gets the current active financial period or creates it if missing (for current month).
 */
export async function getCurrentPeriod(): Promise<FinancialPeriod> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  let period = await prisma.financialPeriod.findFirst({
    where: {
      startDate: startOfMonth,
      endDate: endOfMonth
    }
  });

  if (!period) {
    period = await prisma.financialPeriod.create({
      data: {
        name: startOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        type: 'month',
        startDate: startOfMonth,
        endDate: endOfMonth,
        status: 'open'
      }
    });
  }

  return period;
}

/**
 * Preview what will be locked when closing a period
 * Returns summary of journal entries and orders that will be affected
 */
export async function previewPeriodClose(id: string): Promise<{
  period: FinancialPeriod;
  journalEntriesCount: number;
  totalDebits: number;
  totalCredits: number;
  ordersCount: number;
  revenueRecognized: number;
  warnings: string[];
}> {
  const period = await prisma.financialPeriod.findUnique({
    where: { id }
  });

  if (!period) {
    throw new Error('Period not found');
  }

  if (period.status !== 'open') {
    throw new Error('Period is not open');
  }

  // Get journal entries in this period
  const journalEntries = await prisma.journalEntry.findMany({
    where: {
      date: {
        gte: period.startDate,
        lte: period.endDate
      }
    },
    include: {
      lines: true
    }
  });

  let totalDebits = 0;
  let totalCredits = 0;
  for (const entry of journalEntries) {
    for (const line of entry.lines) {
      totalDebits += Number(line.debit);
      totalCredits += Number(line.credit);
    }
  }

  // Get orders delivered in this period
  const orders = await prisma.order.count({
    where: {
      deliveredAt: {
        gte: period.startDate,
        lte: period.endDate
      }
    }
  });

  // Get revenue recognized
  const revenueRecog = await prisma.revenueRecognition.aggregate({
    where: {
      recognizedAt: {
        gte: period.startDate,
        lte: period.endDate
      }
    },
    _sum: {
      netRevenue: true
    }
  });

  // Warnings
  const warnings: string[] = [];

  // Check for unbalanced entries
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    warnings.push(`WARNING: Journal entries are not balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`);
  }

  // Check for pending orders in period
  const pendingOrders = await prisma.order.count({
    where: {
      createdAt: {
        gte: period.startDate,
        lte: period.endDate
      },
      status: { in: ['pending', 'confirmed', 'paid'] }
    }
  });

  if (pendingOrders > 0) {
    warnings.push(`${pendingOrders} orders are still in processing state and may require attention`);
  }

  return {
    period,
    journalEntriesCount: journalEntries.length,
    totalDebits,
    totalCredits,
    ordersCount: orders,
    revenueRecognized: Number(revenueRecog._sum.netRevenue || 0),
    warnings
  };
}

/**
 * Closes a financial period.
 * This should trigger a snapshot of the P&L and Balance Sheet.
 */
export async function closePeriod(id: string, adminId: string): Promise<FinancialPeriod> {
  // 1. Verify all drafts are processed? (Optional strictness)
  
  // 2. Lock the period
  const period = await prisma.financialPeriod.update({
    where: { id },
    data: {
      status: 'closed',
      closedAt: new Date(),
      closedBy: adminId
    }
  });
  
  // 3. TODO: Generate and save Report Snapshot to 'reportSnapshot' field
  
  return period;
}

/**
 * Reopens a financial period (Audit risk).
 */
export async function reopenPeriod(id: string, adminId: string, reason: string): Promise<FinancialPeriod> {
  return await prisma.financialPeriod.update({
    where: { id },
    data: {
      status: 'open',
      reopenedAt: new Date(),
      reopenedBy: adminId,
      reopenReason: reason
    }
  });
}

/**
 * Lists all periods with their status.
 */
export async function getFinancialPeriods() {
  return await prisma.financialPeriod.findMany({
    orderBy: { startDate: 'desc' }
  });
}
