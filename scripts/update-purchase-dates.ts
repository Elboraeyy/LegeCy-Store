import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== UPDATING PURCHASE DATES FOR ALL PRODUCTS ===');

  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products to check and update.`);

  let updatedCount = 0;

  for (const product of products) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentSpecs: any = {};
    
    if (product.specs && typeof product.specs === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentSpecs = { ...(product.specs as any) };
    }

    // Update or set purchaseDate
    currentSpecs.purchaseDate = '2026-02-02';

    await prisma.product.update({
      where: { id: product.id },
      data: { specs: currentSpecs }
    });

    updatedCount++;
  }

  console.log(`Successfully updated purchaseDate in specs for ${updatedCount} products.`);

  // Check and update PurchaseInvoices if any exist
  const invoices = await prisma.purchaseInvoice.findMany();
  if (invoices.length > 0) {
    console.log(`Found ${invoices.length} purchase invoices. Updating their dates to 2026-02-02...`);
    const date = new Date('2026-02-02T00:00:00.000Z');
    
    await prisma.purchaseInvoice.updateMany({
      data: {
        issueDate: date,
        postedDate: date
      }
    });
    console.log('Successfully updated purchase invoice dates.');
  } else {
    console.log('No purchase invoices found in database.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
