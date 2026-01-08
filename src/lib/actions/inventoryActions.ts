'use server';

import prisma from '@/lib/prisma';
import { AccountType } from '@prisma/client';
import { createJournalEntry } from '@/lib/services/revenueService';
import { ACCOUNTS } from '@/lib/constants/accounts';
import { getInventoryValuation } from '@/lib/services/inventoryValuationService';

/**
 * Sync inventory value to ledger (for reconciliation)
 */
export async function syncInventoryToLedger() {
  const valuation = await getInventoryValuation();
  
  // Get or create inventory account
  let inventoryAccount = await prisma.account.findFirst({
    where: { code: '1200' }
  });

  if (!inventoryAccount) {
    inventoryAccount = await prisma.account.create({
      data: {
        code: '1200',
        name: 'Inventory',
        type: AccountType.ASSET,
        balance: 0
      }
    });
  }

  // Update balance to match physical valuation
  const currentBalance = Number(inventoryAccount.balance);
  const newBalance = valuation.atCost;
  const difference = newBalance - currentBalance;

  if (Math.abs(difference) > 0.01) {
    const isGain = difference > 0;
    
    // Create Journal Entry for adjustment (Double Entry)
    // Gain: Debit Inventory (1200), Credit Adjustment (5300) - effectively negative expense or contra-expense
    // Loss: Debit Adjustment (5300), Credit Inventory (1200)
    
    await createJournalEntry({
      description: `Inventory Valuation Adjustment - Automated`,
      lines: [
        {
          accountCode: ACCOUNTS.INVENTORY,
          debit: isGain ? difference : 0,
          credit: isGain ? 0 : Math.abs(difference),
          description: 'Inventory Asset Adjustment'
        },
        {
          accountCode: ACCOUNTS.INVENTORY_ADJUSTMENT,
          debit: isGain ? 0 : Math.abs(difference),
          credit: isGain ? difference : 0,
          description: 'Valuation Gain/Loss'
        }
      ],
      reference: `VAL-${new Date().toISOString().split('T')[0]}`,
      createdBy: 'system'
    });

    console.log(`[InventoryValuation] Posted adjustment journal: ${difference}`);
  }

  return {
    previousBalance: currentBalance,
    newBalance,
    adjustment: difference
  };
}
