import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== RECONCILING GL CASH ACCOUNT WITH SAFE CASH BALANCE ===');

  const safe = await prisma.safe.findUnique({
    where: { name: 'Cash (Office)' }
  });
  if (!safe) {
    throw new Error('Cash (Office) safe not found.');
  }
  const targetBalance = safe.balance.toNumber(); // 40475

  const cashAccount = await prisma.account.findFirst({ where: { code: '1000' } });
  if (!cashAccount) {
    throw new Error('Cash account (1000) not found.');
  }
  const currentGLCash = cashAccount.balance.toNumber(); // 34284.79

  const difference = targetBalance - currentGLCash; // 6190.21
  console.log(`Target safe balance: EGP ${targetBalance}`);
  console.log(`Current GL cash balance: EGP ${currentGLCash}`);
  console.log(`Difference to adjust: EGP ${difference}`);

  if (difference === 0) {
    console.log('Balances already match. No adjustment needed.');
    return;
  }

  const equityAccount = await prisma.account.findFirst({ where: { code: '3000' } });
  if (!equityAccount) {
    throw new Error("Owner's Equity account (3000) not found.");
  }
  const currentEquity = equityAccount.balance.toNumber();

  console.log('\nAdjusting balances in transaction...');
  await prisma.$transaction(async (tx) => {
    // 1. Update GL Cash Account to match target safe balance
    await tx.account.update({
      where: { id: cashAccount.id },
      data: { balance: targetBalance }
    });
    console.log(`- Updated Cash on Hand (1000) balance to EGP ${targetBalance}`);

    // 2. Adjust Owner's Equity by the difference to keep Trial Balance balanced
    const newEquity = currentEquity + difference;
    await tx.account.update({
      where: { id: equityAccount.id },
      data: { balance: newEquity }
    });
    console.log(`- Adjusted Owner's Equity (3000) from EGP ${currentEquity} to EGP ${newEquity}`);

    // 3. Create a balancing journal entry for this reconciliation
    const admin = await tx.adminUser.findFirst({ where: { isActive: true } });
    const adminId = admin ? admin.id : 'system';

    const journal = await tx.journalEntry.create({
      data: {
        description: 'Reconciliation of GL Cash with Safe Cash Balance',
        createdBy: adminId,
        date: new Date(),
        status: 'POSTED'
      }
    });

    // Debit Cash (increases asset)
    await tx.transactionLine.create({
      data: {
        journalEntryId: journal.id,
        accountId: cashAccount.id,
        debit: difference,
        credit: 0,
        description: 'Cash reconciliation adjustment'
      }
    });

    // Credit Equity (increases equity)
    await tx.transactionLine.create({
      data: {
        journalEntryId: journal.id,
        accountId: equityAccount.id,
        debit: 0,
        credit: difference,
        description: 'Cash reconciliation adjustment'
      }
    });
  });

  console.log('\n=== RECONCILIATION COMPLETE ===');
  const finalCash = await prisma.account.findFirst({ where: { code: '1000' } });
  const finalEquity = await prisma.account.findFirst({ where: { code: '3000' } });
  console.log(`Final Cash on Hand (1000) Balance: EGP ${finalCash?.balance.toNumber()}`);
  console.log(`Final Owner's Equity (3000) Balance: EGP ${finalEquity?.balance.toNumber()}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
