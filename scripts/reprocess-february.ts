import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== CHECKING MONTH CLOSING FOR FEBRUARY 2026 ===');

  const closing = await prisma.monthClosing.findFirst({
    where: { month: 2, year: 2026 }
  });

  if (!closing) {
    console.log('Month closing for February 2026 not found.');
    return;
  }

  console.log(`Closing ID: ${closing.id}`);
  console.log(`Status: ${closing.status}`);
  console.log(`Net Profit: ${closing.netProfit.toNumber()}`);
  console.log(`Reinvestment Amount: ${closing.reinvestmentAmount.toNumber()}`);
  console.log(`Distribution Amount: ${closing.distributionAmount.toNumber()}`);

  // Find if there is any SafeTransaction linked to this closing
  const safeTx = await prisma.safeTransaction.findFirst({
    where: { referenceType: 'MONTH_CLOSING', referenceId: closing.id }
  });

  if (safeTx) {
    console.log(`Safe transaction already exists! ID: ${safeTx.id}, Type: ${safeTx.type}, Amount: ${safeTx.amount.toNumber()}`);
    return;
  }

  console.log('No safe transaction found for this month closing. Reinvestment is negative: we need to apply the DEBIT.');

  // Find the 'Cash' safe or the main safe.
  const safes = await prisma.safe.findMany({
    where: { isActive: true }
  });

  console.log('Safes:');
  for (const s of safes) {
    console.log(`- ${s.name} (ID: ${s.id}, Balance: ${s.balance.toNumber()})`);
  }

  // Use the Cash safe (we expect the name to contain 'Cash' or 'كاش')
  const cashSafe = safes.find(s => s.name.toLowerCase().includes('cash') || s.name.includes('كاش'));

  if (!cashSafe) {
    console.error('Error: Could not find the Cash safe!');
    return;
  }

  console.log(`Using Cash Safe: ${cashSafe.name} (ID: ${cashSafe.id})`);

  const lossAmount = Math.abs(closing.reinvestmentAmount.toNumber());
  console.log(`Deducting ${lossAmount} EGP from Cash Safe...`);

  await prisma.$transaction(async (tx) => {
    // 1. Decrement Cash safe balance
    const updatedSafe = await tx.safe.update({
      where: { id: cashSafe.id },
      data: { balance: { decrement: lossAmount } }
    });

    // 2. Create the DEBIT SafeTransaction
    const newSafeTx = await tx.safeTransaction.create({
      data: {
        safeId: cashSafe.id,
        type: 'DEBIT',
        amount: lossAmount,
        balanceAfter: updatedSafe.balance.toNumber(),
        description: `Brand reinvestment loss for month ${closing.month}/${closing.year}`,
        referenceType: 'MONTH_CLOSING',
        referenceId: closing.id,
        createdBy: closing.closedBy
      }
    });

    console.log(`Safe balance updated successfully. New balance: ${updatedSafe.balance.toNumber()}`);
    console.log(`SafeTransaction created successfully. ID: ${newSafeTx.id}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
