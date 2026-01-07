
import { PrismaClient } from '@prisma/client';
import { InventoryIntakeService } from '../src/lib/services/inventory-intake';
import { InvoiceStateMachine } from '../src/lib/services/invoice-machine';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING PROCUREMENT SIMULATION ---');

    // 1. Setup: Ensure we have a supplier and a product
    console.log('1. Setting up Test Data...');
    
    let supplier = await prisma.supplier.findFirst({ where: { name: 'SIMULATION_SUPPLIER' } });
    if (!supplier) {
        supplier = await prisma.supplier.create({
            data: { 
                name: 'SIMULATION_SUPPLIER',
                paymentTerms: 'NET30'
            }
        });
        console.log('   - Created Supplier:', supplier.id);
    }

    // Ensure a product exists
    const product = await prisma.product.findFirst();
    if (!product) {
       // Create dummy if needed, but assuming DB has some data or we fail.
       console.error('   - NO PRODUCTS FOUND. Please seed database first.');
       return;
    }
    const variant = await prisma.variant.findFirst({ where: { productId: product.id } });
    if (!variant) {
        console.error('   - NO VARIANTS FOUND.');
        return;
    }
    console.log(`   - Using Product: ${product.name} (Variant: ${variant.id})`);

    // 2. Draft Invoice
    console.log('2. Drafting Invoice...');
    const invoice = await prisma.purchaseInvoice.create({
        data: {
            supplierId: supplier.id,
            invoiceNumber: `SIM-${Date.now()}`,
            issueDate: new Date(),
            status: 'DRAFT',
            subtotal: 0,
            taxTotal: 0,
            shippingTotal: 0,
            discountTotal: 0,
            grandTotal: 0
        }
    });

    // 3. Add Items
    console.log('3. Adding Items...');
    const qty = 10;
    const unitCost = 100;
    const totalCost = qty * unitCost;

    await prisma.purchaseInvoiceItem.create({
        data: {
            invoiceId: invoice.id,
            productId: product.id,
            variantId: variant.id,
            description: product.name,
            quantity: qty,
            unitCost: unitCost,
            totalCost: totalCost,
            finalUnitCost: unitCost
        }
    });

    await prisma.purchaseInvoice.update({
        where: { id: invoice.id },
        data: {
            subtotal: totalCost,
            grandTotal: totalCost
        }
    });
    console.log(`   - Added ${qty} units @ ${unitCost} EGP. Total: ${totalCost}`);

    // 3.5 Transitions (Draft -> Reviewed -> Approved)
    console.log('3.5 Moving through Approval Workflow...');
    await InvoiceStateMachine.transition(invoice.id, 'REVIEWED', 'SIMULATION_ADMIN');
    await InvoiceStateMachine.transition(invoice.id, 'APPROVED', 'SIMULATION_ADMIN');
    console.log('   - Invoice APPROVED ready for Posting.');

    // 4. Post Invoice (The Critical Step)
    console.log('4. Posting Invoice (Running InventoryIntakeService)...');
    try {
        // Need a warehouse ID. Using first found.
        const warehouse = await prisma.warehouse.findFirst();
        if (!warehouse) throw new Error("No warehouse found");

        const postedInvoice = await InventoryIntakeService.postInvoice(
            invoice.id, 
            warehouse.id, 
            'SIMULATION_ADMIN'
        );
        console.log('   - Invoice POSTED successfully.');
        console.log('   - Status:', postedInvoice.status);

        // 5. Verify Ledger
        console.log('5. Verifying Ledger...');
        const ledgerEvents = await prisma.invoiceLedgerEvent.findMany({ where: { invoiceId: invoice.id } });
        ledgerEvents.forEach(e => {
            console.log(`   - [${e.type}] ${e.debitAccount} / ${e.creditAccount}: ${e.amount}`);
        });

        // 6. Verify Stock
        console.log('6. Verifying Stock Batches...');
        const batches = await prisma.inventoryBatch.findMany({ 
            where: { purchaseItem: { invoiceId: invoice.id } } 
        });
        batches.forEach(b => {
             console.log(`   - Batch created: ${b.remainingQuantity} units @ ${b.unitCost} EGP`);
        });

        console.log('--- SIMULATION COMPLETE: SUCCESS ---');

    } catch (error) {
        console.error('!!! SIMULATION FAILED !!!');
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error('Unknown error', error);
        }
    }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
