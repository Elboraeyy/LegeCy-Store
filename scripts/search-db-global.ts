import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== GLOBAL ARABIC SEARCH IN DATABASE ===\n');

  // Helper to check regex
  const hasArabic = (str: string | null | undefined) => {
    if (!str) return false;
    return /[\u0600-\u06FF]/.test(str);
  };

  // 1. MonthClosing
  const monthClosings = await prisma.monthClosing.findMany();
  monthClosings.forEach(mc => {
    if (hasArabic(mc.notes) || hasArabic(mc.adjustmentNote)) {
      console.log(`MonthClosing ID: ${mc.id}, Month: ${mc.month}/${mc.year}, notes: "${mc.notes}", adjustmentNote: "${mc.adjustmentNote}"`);
    }
  });

  // 2. MonthClosingPartner
  const monthClosingPartners = await prisma.monthClosingPartner.findMany();
  monthClosingPartners.forEach(mcp => {
    if (hasArabic(mcp.partnerName)) {
      console.log(`MonthClosingPartner ID: ${mcp.id}, partnerName: "${mcp.partnerName}"`);
    }
  });

  // 3. PartnerWithdrawal
  const withdrawals = await prisma.partnerWithdrawal.findMany();
  withdrawals.forEach(w => {
    if (hasArabic(w.notes) || hasArabic(w.rejectedReason)) {
      console.log(`PartnerWithdrawal ID: ${w.id}, notes: "${w.notes}", rejectedReason: "${w.rejectedReason}"`);
    }
  });

  // 4. SafeTransaction
  const safeTxs = await prisma.safeTransaction.findMany();
  safeTxs.forEach(tx => {
    if (hasArabic(tx.description)) {
      console.log(`SafeTransaction ID: ${tx.id}, Amount: ${tx.amount}, Desc: "${tx.description}", RefType: ${tx.referenceType}`);
    }
  });

  // 5. CapitalTransaction
  const capitalTxs = await prisma.capitalTransaction.findMany();
  capitalTxs.forEach(tx => {
    if (hasArabic(tx.description)) {
      console.log(`CapitalTransaction ID: ${tx.id}, Amount: ${tx.amount}, Desc: "${tx.description}"`);
    }
  });

  // 6. JournalEntry
  const journalEntries = await prisma.journalEntry.findMany();
  journalEntries.forEach(je => {
    if (hasArabic(je.description) || hasArabic(je.reference)) {
      console.log(`JournalEntry ID: ${je.id}, Desc: "${je.description}", Ref: "${je.reference}"`);
    }
  });

  // 7. TransactionLine
  const txLines = await prisma.transactionLine.findMany();
  txLines.forEach(tl => {
    if (hasArabic(tl.description)) {
      console.log(`TransactionLine ID: ${tl.id}, Desc: "${tl.description}"`);
    }
  });

  // 8. Expense
  const expenses = await prisma.expense.findMany();
  expenses.forEach(e => {
    if (hasArabic(e.description)) {
      console.log(`Expense ID: ${e.id}, Desc: "${e.description}"`);
    }
  });

  console.log('\n=== SEARCH COMPLETED ===');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
