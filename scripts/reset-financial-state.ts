import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== RESETTING DATABASE TO INITIAL CLEAN FINANCIAL STATE ===');

  await prisma.$transaction(async (tx) => {
    // 1. Delete all SafeTransaction entries for orders
    const deletedSafeTxs = await tx.safeTransaction.deleteMany({
      where: { referenceType: 'ORDER' }
    });
    console.log(`- Deleted ${deletedSafeTxs.count} order SafeTransactions`);

    // 2. Delete all JournalEntries and TransactionLines related to orders
    // In Prisma, deleting a JournalEntry will cascade delete TransactionLines if defined,
    // but to be safe we'll delete the TransactionLines first.
    const orderJournals = await tx.journalEntry.findMany({
      where: {
        OR: [
          { orderId: { not: null } },
          { reference: { startsWith: 'ORD-' } }
        ]
      }
    });
    const orderJournalIds = orderJournals.map(j => j.id);

    const deletedLines = await tx.transactionLine.deleteMany({
      where: { journalEntryId: { in: orderJournalIds } }
    });
    console.log(`- Deleted ${deletedLines.count} order Journal Transaction Lines`);

    const deletedJournals = await tx.journalEntry.deleteMany({
      where: { id: { in: orderJournalIds } }
    });
    console.log(`- Deleted ${deletedJournals.count} order Journal Entries`);

    // 3. Reset Safe balance for 'Cash (Office)'
    const targetSafeBalance = 41000 - 22265; // 18,735
    const officeSafe = await tx.safe.findUnique({ where: { name: 'Cash (Office)' } });
    if (officeSafe) {
      await tx.safe.update({
        where: { id: officeSafe.id },
        data: { balance: targetSafeBalance }
      });
      console.log(`- Reset Cash (Office) Safe balance to EGP ${targetSafeBalance}`);
    } else {
      console.log('- Warning: Cash (Office) Safe not found');
    }

    // 4. Reset GL Accounts balances
    const accountsToReset = [
      { code: '1000', balance: targetSafeBalance }, // Cash on Hand
      { code: '3000', balance: 41000 },            // Owner's Equity
      { code: '4000', balance: 0 },                // Sales Revenue
      { code: '2002', balance: 0 },                // Sales Tax Payable
      { code: '5000', balance: 0 },                // Cost of Goods Sold
      { code: '1200', balance: 0 },                // Inventory
      { code: '2100', balance: 0 },                // Deferred Revenue
    ];

    for (const acc of accountsToReset) {
      const dbAcc = await tx.account.findFirst({ where: { code: acc.code } });
      if (dbAcc) {
        await tx.account.update({
          where: { id: dbAcc.id },
          data: { balance: acc.balance }
        });
        console.log(`- Reset Account ${dbAcc.name} (${acc.code}) balance to EGP ${acc.balance}`);
      } else {
        console.log(`- Warning: Account with code ${acc.code} not found`);
      }
    }

    // 5. Reset all orders to isFinanciallyAudited = false and clear audit fields
    const updatedOrders = await tx.order.updateMany({
      where: {},
      data: {
        isFinanciallyAudited: false,
        wholesaleCost: null,
        packagingCost: null,
        actualShippingCost: null,
        extraExpenses: null,
        netProfit: null,
        auditedById: null,
        auditSafeId: null,
        auditNotes: null,
        auditedAt: null
      }
    });
    console.log(`- Reset ${updatedOrders.count} orders to un-audited state`);

    // 6. Reset all order item costAtPurchase snapshots to null to allow fresh snapshotting
    const updatedOrderItems = await tx.orderItem.updateMany({
      where: {},
      data: {
        costAtPurchase: null
      }
    });
    console.log(`- Reset costAtPurchase on ${updatedOrderItems.count} order items`);

    // 7. Delete any existing MonthClosing/MonthClosingPartner records if any exist
    const deletedClosingPartners = await tx.monthClosingPartner.deleteMany({});
    const deletedClosings = await tx.monthClosing.deleteMany({});
    console.log(`- Cleaned up ${deletedClosings.count} MonthClosings and ${deletedClosingPartners.count} Partner Distributions`);
  }, { timeout: 180000 });

  console.log('\n=== RESET COMPLETE ===');
}

main()
  .catch(e => {
    console.error('Error resetting financial state:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
