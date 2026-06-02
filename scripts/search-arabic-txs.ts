import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== SEARCHING FOR ARABIC TRANSACTIONS ===\n');

  // 1. SafeTransaction
  const safeTxs = await prisma.safeTransaction.findMany();
  console.log(`Total SafeTransactions: ${safeTxs.length}`);
  const arabicSafeTxs = safeTxs.filter(tx => tx.description && /[\u0600-\u06FF]/.test(tx.description));
  console.log(`Arabic SafeTransactions found: ${arabicSafeTxs.length}`);
  arabicSafeTxs.forEach(tx => {
    console.log(`- ID: ${tx.id}, Amount: ${tx.amount}, Desc: "${tx.description}", CreatedAt: ${tx.createdAt.toISOString()}`);
  });

  console.log('\n----------------------------------------\n');

  // 2. CapitalTransaction
  const capitalTxs = await prisma.capitalTransaction.findMany();
  console.log(`Total CapitalTransactions: ${capitalTxs.length}`);
  const arabicCapitalTxs = capitalTxs.filter(tx => tx.description && /[\u0600-\u06FF]/.test(tx.description));
  console.log(`Arabic CapitalTransactions found: ${arabicCapitalTxs.length}`);
  arabicCapitalTxs.forEach(tx => {
    console.log(`- ID: ${tx.id}, Amount: ${tx.amount}, Desc: "${tx.description}", CreatedAt: ${tx.createdAt.toISOString()}`);
  });

  console.log('\n----------------------------------------\n');

  // 3. PartnerWithdrawal
  const withdrawals = await prisma.partnerWithdrawal.findMany();
  console.log(`Total PartnerWithdrawals: ${withdrawals.length}`);
  const arabicWithdrawals = withdrawals.filter(w => w.notes && /[\u0600-\u06FF]/.test(w.notes));
  console.log(`Arabic PartnerWithdrawals found: ${arabicWithdrawals.length}`);
  arabicWithdrawals.forEach(w => {
    console.log(`- ID: ${w.id}, Amount: ${w.amount}, Notes: "${w.notes}", CreatedAt: ${w.createdAt.toISOString()}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
