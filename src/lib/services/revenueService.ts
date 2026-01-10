/**
 * Revenue Service
 * 
 * Handles revenue recognition and COGS recording using double-entry accounting.
 * This is the financial heart of the neural system.
 * 
 * Standard Account Codes:
 * - 1000: Cash on Hand (ASSET)
 * - 1100: Accounts Receivable (ASSET)
 * - 1200: Inventory (ASSET)
 * - 2100: Deferred Revenue (LIABILITY)
 * - 4000: Sales Revenue (REVENUE)
 * - 5000: Cost of Goods Sold (EXPENSE)
 */

import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { AccountType } from '@prisma/client';
import { validateTransactionDate } from './accountingPeriodService';

// Account codes (should match seeded accounts)
// Account codes (should match seeded accounts)
import { ACCOUNTS } from '@/lib/constants/accounts';

/**
 * Get or create a standard account by code
 */
async function getAccountByCode(code: string) {
  let account = await prisma.account.findFirst({
    where: { code }
  });
  
  if (!account) {
    // Create missing standard accounts
    const accountDefs: Record<string, { name: string; type: AccountType }> = {
      '1000': { name: 'Cash on Hand', type: AccountType.ASSET },
      '1100': { name: 'Accounts Receivable', type: AccountType.ASSET },
      '1200': { name: 'Inventory', type: AccountType.ASSET },
      '2100': { name: 'Deferred Revenue', type: AccountType.LIABILITY },
      '3000': { name: 'Owner\'s Equity', type: AccountType.EQUITY },
      '4000': { name: 'Sales Revenue', type: AccountType.REVENUE },
      '5000': { name: 'Cost of Goods Sold', type: AccountType.EXPENSE },
      '5300': { name: 'Inventory Adjustment', type: AccountType.EXPENSE },
    };
    
    const def = accountDefs[code];
    if (def) {
      account = await prisma.account.create({
        data: {
          code,
          name: def.name,
          type: def.type,
          balance: 0
        }
      });
    }
  }
  
  return account;
}

export type JournalEntryInput = {
  reference?: string;
  description: string;
  date?: Date;
  lines: {
    accountCode: string; // Changed from accountId to accountCode to match existing logic
    debit?: number | Decimal;
    credit?: number | Decimal;
    description?: string;
  }[];
  
  // Linkage
  orderId?: string;
  expenseId?: string;
  capitalTxId?: string;
  createdBy: string;
};

/**
 * Create a balanced journal entry
 */
export async function createJournalEntry(input: JournalEntryInput) {
  const { lines, description, reference, date, orderId, expenseId, capitalTxId, createdBy } = input;
  const entryDate = date || new Date();

  // 0. STRICT PERIOD CHECK
  const isPeriodOpen = await validateTransactionDate(entryDate);
  if (!isPeriodOpen) {
    throw new Error(`Financial Period is CLOSED for date ${entryDate.toISOString().split('T')[0]}. No transactions allowed.`);
  }

  // 1. Validate Total Debit = Total Credit
  let totalDebit = new Decimal(0);
  let totalCredit = new Decimal(0);
  
  for (const line of lines) {
    totalDebit = totalDebit.plus(line.debit || 0);
    totalCredit = totalCredit.plus(line.credit || 0);
  }
  
  if (totalDebit.minus(totalCredit).abs().greaterThan(0.01)) {
    throw new Error(`Journal entry not balanced: Debit=${totalDebit}, Credit=${totalCredit}`);
  }
  
  // Create journal entry
  const entry = await prisma.journalEntry.create({
    data: {
      date: new Date(),
      description,
      reference,
      status: 'POSTED',
      orderId,
      expenseId,
      capitalTxId,
      createdBy: createdBy || 'system'
    }
  });
  
  // Create transaction lines and update account balances
  for (const line of lines) {
    const account = await getAccountByCode(line.accountCode);
    if (!account) {
      throw new Error(`Account ${line.accountCode} not found`);
    }
    
    await prisma.transactionLine.create({
      data: {
        journalEntryId: entry.id,
        accountId: account.id,
        debit: line.debit ? new Decimal(line.debit) : new Decimal(0),
        credit: line.credit ? new Decimal(line.credit) : new Decimal(0),
        description: line.description
      }
    });
    
    // Update account balance
    // ASSET & EXPENSE: Debit increases, Credit decreases
    // LIABILITY, EQUITY, REVENUE: Credit increases, Debit decreases
    // LIABILITY, EQUITY, REVENUE: Credit increases, Debit decreases
    const isDebitNormal = ([AccountType.ASSET, AccountType.EXPENSE] as AccountType[]).includes(account.type);
    const debit = line.debit ? new Decimal(line.debit) : new Decimal(0);
    const credit = line.credit ? new Decimal(line.credit) : new Decimal(0);

    const balanceChange = isDebitNormal 
      ? debit.minus(credit)
      : credit.minus(debit);
    
    await prisma.account.update({
      where: { id: account.id },
      data: { balance: { increment: balanceChange } }
    });
  }
  
  return entry;
}

export const revenueService = {
  /**
   * Recognize revenue for a delivered order
   */
  async recognizeRevenue(orderId: string, netRevenue: number, cogsAmount: number) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error(`Order ${orderId} not found`);
    
    const orderRef = `ORD-${orderId.substring(0, 8)}`;
    
    // 1. Revenue Entry
    const isCOD = order.paymentMethod === 'cod';
    const cashAccount = isCOD ? ACCOUNTS.CASH : ACCOUNTS.ACCOUNTS_RECEIVABLE;
    
    const revenueEntry = await createJournalEntry({
      description: `Revenue recognized - Order ${orderRef}`,
      lines: [
        { 
          accountCode: cashAccount, 
          debit: netRevenue, 
          description: isCOD ? 'Cash received' : 'Receivable from online payment' 
        },
        { 
          accountCode: ACCOUNTS.SALES_REVENUE, 
          credit: netRevenue, 
          description: 'Sales revenue' 
        }
      ],
      reference: orderRef,
      orderId: orderId,
      createdBy: 'system'
    });
    
    // 2. COGS Entry (only if there's cost)
    let cogsEntry = null;
    if (cogsAmount > 0) {
      cogsEntry = await createJournalEntry({
        description: `COGS recognized - Order ${orderRef}`,
        lines: [
          { 
            accountCode: ACCOUNTS.COGS, 
            debit: cogsAmount, 
            description: 'Cost of goods sold' 
          },
          { 
            accountCode: ACCOUNTS.INVENTORY, 
            credit: cogsAmount, 
            description: 'Inventory reduction' 
          }
        ],
        reference: orderRef,
        orderId: orderId,
        createdBy: 'system'
      });
    }
    
    // Update revenue recognition with journal IDs
    await prisma.revenueRecognition.update({
      where: { orderId },
      data: {
        revenueJournalId: revenueEntry.id,
        cogsJournalId: cogsEntry?.id
      }
    });
    
    console.log(`[RevenueService] Revenue recognized for ${orderRef}: Revenue=${netRevenue}, COGS=${cogsAmount}`);
    
    return { revenueEntry, cogsEntry };
  },
  
  /**
   * Reverse revenue for a cancelled order
   */
  async reverseRevenue(orderId: string, reason: string) {
    const recognition = await prisma.revenueRecognition.findUnique({
      where: { orderId }
    });
    
    if (!recognition) {
      console.log(`[RevenueService] No revenue to reverse for order ${orderId}`);
      return;
    }
    
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;
    
    const orderRef = `ORD-${orderId.substring(0, 8)}-REV`;
    const netRevenue = Number(recognition.netRevenue);
    const cogsAmount = Number(recognition.cogsAmount);
    
    // 1. Reverse Revenue Entry
    const isCOD = order.paymentMethod === 'cod';
    const cashAccount = isCOD ? ACCOUNTS.CASH : ACCOUNTS.ACCOUNTS_RECEIVABLE;
    
    await createJournalEntry({
      description: `Revenue reversal - ${reason}`,
      lines: [
        { 
          accountCode: ACCOUNTS.SALES_REVENUE, 
          debit: netRevenue, 
          description: 'Reversal of sales revenue' 
        },
        { 
          accountCode: cashAccount, 
          credit: netRevenue, 
          description: 'Cash/Receivable reversal' 
        }
      ],
      reference: orderRef,
      orderId: orderId,
      createdBy: 'system'
    });
    
    // 2. Reverse COGS Entry
    if (cogsAmount > 0) {
      await createJournalEntry({
        description: `COGS reversal - ${reason}`,
        lines: [
          { 
            accountCode: ACCOUNTS.INVENTORY, 
            debit: cogsAmount, 
            description: 'Inventory restoration' 
          },
          { 
            accountCode: ACCOUNTS.COGS, 
            credit: cogsAmount, 
            description: 'Reversal of COGS' 
          }
        ],
        reference: orderRef,
        orderId: orderId,
        createdBy: 'system'
      });
    }
    
    console.log(`[RevenueService] Revenue reversed for ${orderRef}: Revenue=${netRevenue}, COGS=${cogsAmount}`);
  },
  
  /**
   * Create refund journal entry for partial refund
   */
  async createRefundEntry(orderId: string, revenueToReverse: number, cogsToReverse: number, reason?: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;
    
    const orderRef = `ORD-${orderId.substring(0, 8)}-REF`;
    
    // Reverse revenue proportionally
    const isCOD = order.paymentMethod === 'cod';
    const cashAccount = isCOD ? ACCOUNTS.CASH : ACCOUNTS.ACCOUNTS_RECEIVABLE;
    
    await createJournalEntry({
      description: `Refund - ${reason || 'Customer refund'}`,
      lines: [
        { 
          accountCode: ACCOUNTS.SALES_REVENUE, 
          debit: revenueToReverse, 
          description: 'Revenue reduction from refund' 
        },
        { 
          accountCode: cashAccount, 
          credit: revenueToReverse, 
          description: 'Refund paid' 
        }
      ],
      reference: orderRef,
      orderId: orderId,
      createdBy: 'system'
    });
    
    // If goods returned, reverse COGS
    if (cogsToReverse > 0) {
      await createJournalEntry({
        description: `Refund inventory return - ${reason || 'Goods returned'}`,
        lines: [
          { 
            accountCode: ACCOUNTS.INVENTORY, 
            debit: cogsToReverse, 
            description: 'Inventory returned' 
          },
          { 
            accountCode: ACCOUNTS.COGS, 
            credit: cogsToReverse, 
            description: 'COGS reduction' 
          }
        ],
        reference: orderRef,
        orderId: orderId,
        createdBy: 'system'
      });
    }
    
    console.log(`[RevenueService] Refund entry created for ${orderRef}: Revenue=${revenueToReverse}, COGS=${cogsToReverse}`);
  }
};
