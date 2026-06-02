import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== SEARCHING FOR ARABIC TEXTS IN FINANCE TABLES ===\n');

  // 1. SafeTransaction
  const safeTxs = await prisma.safeTransaction.findMany({
    where: {
      description: {
        contains: 'أرباح',
      },
    },
  });
  console.log(`SafeTransactions with 'أرباح': ${safeTxs.length}`);
  safeTxs.forEach(tx => {
    console.log(`- STX ID: ${tx.id}, Desc: "${tx.description}", Amount: ${tx.amount}`);
  });

  const safeTxsReinvest = await prisma.safeTransaction.findMany({
    where: {
      description: {
        contains: 'إعادة استثمار',
      },
    },
  });
  console.log(`SafeTransactions with 'إعادة استثمار': ${safeTxsReinvest.length}`);
  safeTxsReinvest.forEach(tx => {
    console.log(`- STX ID: ${tx.id}, Desc: "${tx.description}", Amount: ${tx.amount}`);
  });

  console.log('\n----------------------------------------\n');

  // 2. JournalEntry
  const journalEntries = await prisma.journalEntry.findMany({
    where: {
      description: {
        contains: 'أرباح',
      },
    },
  });
  console.log(`JournalEntries with 'أرباح': ${journalEntries.length}`);
  journalEntries.forEach(je => {
    console.log(`- JE ID: ${je.id}, Desc: "${je.description}"`);
  });

  const journalEntries2 = await prisma.journalEntry.findMany({
    where: {
      description: {
        contains: 'إعادة استثمار',
      },
    },
  });
  console.log(`JournalEntries with 'إعادة استثمار': ${journalEntries2.length}`);
  journalEntries2.forEach(je => {
    console.log(`- JE ID: ${je.id}, Desc: "${je.description}"`);
  });

  console.log('\n----------------------------------------\n');

  // 3. TransactionLine
  const txLines = await prisma.transactionLine.findMany({
    where: {
      description: {
        contains: 'أرباح',
      },
    },
  });
  console.log(`TransactionLines with 'أرباح': ${txLines.length}`);
  txLines.forEach(tl => {
    console.log(`- TL ID: ${tl.id}, Desc: "${tl.description}"`);
  });

  const txLines2 = await prisma.transactionLine.findMany({
    where: {
      description: {
        contains: 'إعادة استثمار',
      },
    },
  });
  console.log(`TransactionLines with 'إعادة استثمار': ${txLines2.length}`);
  txLines2.forEach(tl => {
    console.log(`- TL ID: ${tl.id}, Desc: "${tl.description}"`);
  });

  console.log('\n----------------------------------------\n');

  // 4. CapitalTransaction
  const capTxs = await prisma.capitalTransaction.findMany({
    where: {
      description: {
        contains: 'أرباح',
      },
    },
  });
  console.log(`CapitalTransactions with 'أرباح': ${capTxs.length}`);
  capTxs.forEach(tx => {
    console.log(`- CTX ID: ${tx.id}, Desc: "${tx.description}"`);
  });

  const capTxs2 = await prisma.capitalTransaction.findMany({
    where: {
      description: {
        contains: 'إعادة استثمار',
      },
    },
  });
  console.log(`CapitalTransactions with 'إعادة استثمار': ${capTxs2.length}`);
  capTxs2.forEach(tx => {
    console.log(`- CTX ID: ${tx.id}, Desc: "${tx.description}"`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
