import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const commit = process.argv.includes('--commit');
  console.log(`=== RUNNING MIGRATION FOR MONTH CLOSING DESCRIPTIONS ===`);
  console.log(`Mode: ${commit ? 'COMMIT (Writing to Database)' : 'DRY RUN (No database writes)'}\n`);

  // Fetch all Month Closing SafeTransactions
  const safeTxs = await prisma.safeTransaction.findMany({
    where: { referenceType: 'MONTH_CLOSING' }
  });

  let updatedCount = 0;

  for (const tx of safeTxs) {
    const desc = tx.description || '';
    
    // Check if the description contains Arabic characters
    if (/[\u0600-\u06FF]/.test(desc)) {
      // Try to extract month and year
      const match = desc.match(/(\d+)\/(\d+)/);
      if (!match) {
        console.log(`[SKIPPED] Cannot parse month/year from: "${desc}" (ID: ${tx.id})`);
        continue;
      }

      const month = match[1];
      const year = match[2];

      // Determine if it was a profit or a loss
      const isLoss = desc.includes('خسارة') || desc.includes('خسائر') || tx.type === 'DEBIT';
      const newDesc = isLoss 
        ? `Brand reinvestment loss for month ${month}/${year}`
        : `Brand reinvestment profit for month ${month}/${year}`;

      console.log(`[UPDATE REQUIRED]`);
      console.log(`  ID:          ${tx.id}`);
      console.log(`  Old Desc:    "${desc}"`);
      console.log(`  New Desc:    "${newDesc}"`);
      console.log(`  Type/Amount: ${tx.type} | ${tx.amount}`);
      
      if (commit) {
        await prisma.safeTransaction.update({
          where: { id: tx.id },
          data: { description: newDesc }
        });
        console.log(`  Status:      UPDATED successfully.`);
      } else {
        console.log(`  Status:      DRY RUN - No change applied.`);
      }
      console.log();
      updatedCount++;
    } else {
      console.log(`[OK] Already in English: "${desc}" (ID: ${tx.id})`);
    }
  }

  console.log(`\nMigration completed.`);
  console.log(`Total records needing translation: ${updatedCount}`);
  if (!commit && updatedCount > 0) {
    console.log(`\nTo apply these changes, run the script with the --commit flag:`);
    console.log(`npx tsx scripts/migrate-arabic-month-closings.ts --commit`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
