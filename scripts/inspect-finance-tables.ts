import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== SAFES ===');
  const safes = await prisma.safe.findMany();
  for (const safe of safes) {
    console.log(`ID: ${safe.id}, Name: ${safe.name}, Balance: ${safe.balance.toNumber()}, Type: ${safe.type}`);
  }

  console.log('\n=== TREASURY ACCOUNTS ===');
  const treasuryAccounts = await prisma.treasuryAccount.findMany();
  for (const ta of treasuryAccounts) {
    console.log(`ID: ${ta.id}, Name: ${ta.name}, Balance: ${ta.balance.toNumber()}, Type: ${ta.type}`);
  }

  console.log('\n=== PURCHASE INVOICES ===');
  const invoices = await prisma.purchaseInvoice.findMany({
    include: {
      supplier: true,
      items: true,
      payments: true
    }
  });
  console.log(`Total purchase invoices: ${invoices.length}`);
  for (const inv of invoices) {
    console.log(`Invoice #${inv.invoiceNumber}, ID: ${inv.id}, Supplier: ${inv.supplier.name}, GrandTotal: ${inv.grandTotal.toNumber()}, Status: ${inv.status}, PaymentStatus: ${inv.paymentStatus}`);
    for (const item of inv.items) {
      console.log(`  - Item: ${item.description}, Qty: ${item.quantity}, Price: ${item.unitCost.toNumber()}`);
    }
    for (const pm of inv.payments) {
      console.log(`  - Payment amount: ${pm.amount.toNumber()}, method: ${pm.method}, date: ${pm.paidAt}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
