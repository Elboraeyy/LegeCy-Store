'use server';

import prisma from '@/lib/prisma';
import { createJournalEntry } from './revenueService';
import { ACCOUNTS } from '@/lib/constants/accounts';
import { CapitalTxType } from '@prisma/client';

/**
 * Capital Service
 * 
 * Manages Investor relations, Capital Injections, and Withdrawals.
 * Links strictly to the Ledger.
 */

export async function getInvestors() {
  return await prisma.investor.findMany({
    include: {
      transactions: {
        orderBy: { date: 'desc' },
        take: 5
      }
    }
  });
}

export async function recordCapitalTransaction(
  investorId: string,
  type: CapitalTxType,
  amount: number,
  description: string,
  adminId: string
) {
  const investor = await prisma.investor.findUnique({ where: { id: investorId } });
  if (!investor) throw new Error('Investor not found');

  // 1. Create Journal Entry (Cash <-> Equity)
  const isDeposit = type === 'DEPOSIT';
  
  // Accounts:
  // Deposit: Debit Cash (1000), Credit Owner Equity (3000)
  // Withdraw: Debit Owner Equity (3000), Credit Cash (1000)
  
  // Need to define EQUITY account. Using generic 3000 for now.
  const EQUITY_ACCOUNT = '3000'; 
  
  const journalObj = {
    description: `Capital ${type} - ${investor.name} - ${description}`,
    lines: [
      {
        accountCode: ACCOUNTS.CASH,
        debit: isDeposit ? amount : 0,
        credit: isDeposit ? 0 : amount,
        description: isDeposit ? 'Capital Injection' : 'Capital Withdrawal'
      },
      {
        accountCode: EQUITY_ACCOUNT,
        debit: isDeposit ? 0 : amount,
        credit: isDeposit ? amount : 0,
        description: `Equity - ${investor.name}`
      }
    ],
    capitalTxId: 'pending', // Will update later
    createdBy: adminId
  };
  
  const journal = await createJournalEntry(journalObj);

  // 2. Create Transaction Record
  const tx = await prisma.capitalTransaction.create({
    data: {
      investorId,
      type,
      amount,
      description,
      journalEntryId: journal.id,
      createdBy: adminId
    }
  });

  // 3. Update Investor Stats (Snapshot)
  const newNet = Number(investor.netContributed) + (isDeposit ? amount : -amount);
  await prisma.investor.update({
    where: { id: investorId },
    data: { netContributed: newNet }
  });
  
  return tx;
}
