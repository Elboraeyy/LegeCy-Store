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
  const investors = await prisma.investor.findMany({
    include: {
      transactions: {
        orderBy: { date: 'desc' },
        take: 5
      }
    }
  });

  // Convert Decimal to plain numbers for client component serialization
  return investors.map(inv => ({
    ...inv,
    netContributed: Number(inv.netContributed),
    currentShare: Number(inv.currentShare),
    transactions: inv.transactions.map(tx => ({
      ...tx,
      amount: Number(tx.amount),
      snapshotTotalCapital: Number(tx.snapshotTotalCapital),
      snapshotShare: Number(tx.snapshotShare)
    }))
  }));
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

  const isDeposit = type === 'DEPOSIT';
  
  // CRITICAL FIX: Validate withdrawal doesn't exceed available balance
  if (!isDeposit) {
    const currentBalance = Number(investor.netContributed);
    if (amount > currentBalance) {
      throw new Error(`Insufficient balance. Available: ${currentBalance.toFixed(2)} EGP, Requested: ${amount.toFixed(2)} EGP`);
    }

    // Check if this withdrawal requires approval
    const { checkApprovalRequired, isApprovalComplete } = await import('./approvalService');
    const approvalCheck = await checkApprovalRequired('CAPITAL_WITHDRAWAL', amount);

    if (approvalCheck.required && approvalCheck.rule) {
      // Check if approval has been granted
      const isApproved = await isApprovalComplete('CAPITAL_WITHDRAWAL', investorId);
      if (!isApproved) {
        throw new Error(`Withdrawals over ${approvalCheck.rule.minAmount} EGP require approval. Please submit an approval request first.`);
      }
    }
  }

  // 1. Create Journal Entry (Cash <-> Equity)
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

export async function createInvestor(data: {
  name: string;
  type: 'OWNER' | 'PARTNER' | 'INVESTOR';
  initialCapital?: number;
  createdBy: string;
}) {
  // Create the investor
  const investor = await prisma.investor.create({
    data: {
      name: data.name,
      type: data.type,
      currentShare: 0, // Will be calculated based on capital
      netContributed: 0
    }
  });

  // If initial capital provided, record the transaction
  if (data.initialCapital && data.initialCapital > 0) {
    await recordCapitalTransaction(
      investor.id,
      'DEPOSIT',
      data.initialCapital,
      'Initial capital contribution',
      data.createdBy
    );
  }

  return investor;
}

export async function deleteInvestor(investorId: string) {
  const investor = await prisma.investor.findUnique({ 
    where: { id: investorId },
    include: { transactions: true }
  });
  
  if (!investor) {
    throw new Error('Investor not found');
  }
  
  // Check if investor has any capital balance
  if (Number(investor.netContributed) !== 0) {
    throw new Error('Cannot delete investor with capital balance. Withdraw all funds first.');
  }
  
  // Delete related transactions first
  if (investor.transactions.length > 0) {
    await prisma.capitalTransaction.deleteMany({
      where: { investorId }
    });
  }
  
  // Delete the investor
  await prisma.investor.delete({
    where: { id: investorId }
  });
  
  return { success: true };
}
