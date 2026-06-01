import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== STARTING RECONCILIATION OF INVOICES AND EXPENSES ===');

  // 1. Get required base entities
  const admin = await prisma.adminUser.findFirst({ where: { isActive: true } });
  const adminId = admin ? admin.id : 'system-migration';
  const adminName = admin ? admin.name : 'System';

  const warehouse = await prisma.warehouse.findFirst();
  if (!warehouse) {
    throw new Error('No warehouse found in database.');
  }
  const warehouseId = warehouse.id;

  const safe = await prisma.safe.findUnique({
    where: { name: 'Cash (Office)' }
  });
  if (!safe) {
    throw new Error('Cash (Office) safe not found in database.');
  }
  const safeId = safe.id;

  const cashAccount = await prisma.account.findFirst({ where: { code: '1000' } });
  if (!cashAccount) {
    throw new Error('General ledger cash account (1000) not found in database.');
  }

  // 2. Perform clean-ups in correct order (due to FK constraints)
  console.log('\nCleaning up old procurement data...');
  
  await prisma.$transaction(async (tx) => {
    // A. Delete dependent invoice details
    await tx.inventoryBatch.deleteMany({});
    console.log('- Deleted all InventoryBatch records');

    await tx.stockInEvent.deleteMany({});
    console.log('- Deleted all StockInEvent records');

    await tx.invoicePayment.deleteMany({});
    console.log('- Deleted all InvoicePayment records');

    await tx.invoiceLedgerEvent.deleteMany({});
    console.log('- Deleted all InvoiceLedgerEvent records');

    await tx.invoiceAuditLog.deleteMany({});
    console.log('- Deleted all InvoiceAuditLog records');

    await tx.accountsPayable.deleteMany({});
    console.log('- Deleted all AccountsPayable records');

    await tx.purchaseInvoice.deleteMany({});
    console.log('- Deleted all PurchaseInvoice records');

    // B. Delete related expenses and journal entries
    await tx.expense.deleteMany({});
    console.log('- Deleted all Expense records');

    await tx.journalEntry.deleteMany({
      where: { expenseId: { not: null } }
    });
    console.log('- Deleted all related journal entries');

    await tx.safeTransaction.deleteMany({
      where: { referenceType: { in: ['EXPENSE', 'PURCHASE_INVOICE'] } }
    });
    console.log('- Deleted all related safe transactions');
  }, {
    timeout: 180000
  });

  // 3. Find or create Expense Category and GL Account
  let expenseCategory = await prisma.expenseCategory.findUnique({
    where: { name: 'مشتريات بضائع' }
  });
  if (!expenseCategory) {
    expenseCategory = await prisma.expenseCategory.create({
      data: { name: 'مشتريات بضائع' }
    });
    console.log('\nCreated Expense Category: مشتريات بضائع');
  }

  let expenseAccount = await prisma.account.findFirst({
    where: { name: 'مشتريات بضائع', type: 'EXPENSE' }
  });
  if (!expenseAccount) {
    expenseAccount = await prisma.account.create({
      data: {
        code: '5001',
        name: 'مشتريات بضائع',
        type: 'EXPENSE',
        balance: 0,
        isSystem: false
      }
    });
    console.log('Created GL Account: مشتريات بضائع (Code: 5001)');
  }

  // 4. Reset Safe balance and Cash Account balance to their pre-reconciliation totals
  // Since we deleted all expenses, let's restore the safe balance first to what it was
  // (We'll subtract the total of the invoices dynamically during the script).
  let currentSafeBalance = safe.balance.toNumber();
  console.log(`\nInitial Safe Balance of "Cash (Office)": EGP ${currentSafeBalance}`);

  let currentCashAccountBalance = cashAccount.balance.toNumber();
  console.log(`Initial GL Cash Account Balance: EGP ${currentCashAccountBalance}`);

  // Reset expenseAccount balance to 0 (since all expenses are deleted)
  await prisma.account.update({
    where: { id: expenseAccount.id },
    data: { balance: 0 }
  });

  // 5. Fetch all variants, products, and delivered order items
  const variants = await prisma.variant.findMany({
    include: {
      product: {
        include: {
          supplier: true
        }
      },
      inventory: true
    }
  });

  const soldItems = await prisma.orderItem.findMany({
    where: {
      order: { status: 'delivered' }
    }
  });

  // Map variantId -> list of sold items
  const soldItemsMap = new Map<string, typeof soldItems>();
  for (const item of soldItems) {
    if (item.variantId) {
      const list = soldItemsMap.get(item.variantId) || [];
      list.push(item);
      soldItemsMap.set(item.variantId, list);
    }
  }

  // Group variants by Supplier
  const supplierGroups = new Map<string, typeof variants>();
  for (const v of variants) {
    const supplierId = v.product.supplierId || 'default-supplier';
    const list = supplierGroups.get(supplierId) || [];
    list.push(v);
    supplierGroups.set(supplierId, list);
  }

  const invoiceDate = new Date('2026-02-02T00:00:00.000Z');

  // 6. Loop through each supplier group and process invoices & expenses
  for (const [supplierId, groupVariants] of supplierGroups.entries()) {
    // Get supplier name
    let supplierName = 'Main Supplier';
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (supplier) {
      supplierName = supplier.name;
    }

    console.log(`\nProcessing Supplier: ${supplierName} (${supplierId})`);

    const invoiceNumber = `INV-${supplierName.toUpperCase().replace(/\s+/g, '')}-02022026`;
    const batchesToCreate: {
      variantId: string;
      productId: string;
      sku: string;
      name: string;
      qty: number;
      remaining: number;
      price: number;
    }[] = [];

    // Compile items for this supplier
    for (const v of groupVariants) {
      const availableStock = v.inventory.reduce((sum, inv) => sum + inv.available, 0);
      const itemSales = soldItemsMap.get(v.id) || [];
      const totalSold = itemSales.reduce((sum, sale) => sum + sale.quantity, 0);

      // Determine default supplier price from specs
      let defaultSupplierPrice = 0;
      if (v.product.specs && typeof v.product.specs === 'object') {
        const specs = v.product.specs as Record<string, unknown>;
        if (specs['supplierPrice'] !== undefined) {
          defaultSupplierPrice = Number(specs['supplierPrice']);
        }
      }
      if (defaultSupplierPrice === 0) {
        const systemCost = v.costPrice ? v.costPrice.toNumber() : (v.product.costPrice ? v.product.costPrice.toNumber() : 0);
        defaultSupplierPrice = systemCost > 100 ? systemCost - 100 : systemCost;
      }

      // Check for price-split SKUs
      if (v.sku === 'W0038') {
        // Rolex Land Dweller Tiffany Dial:
        // - 2 bought at 450 (both sold, remaining = 0)
        // - 5 bought at 400 (2 sold, 3 in stock, remaining = 3)
        batchesToCreate.push({
          variantId: v.id,
          productId: v.product.id,
          sku: v.sku,
          name: v.product.name,
          qty: 2,
          remaining: 0,
          price: 450
        });
        batchesToCreate.push({
          variantId: v.id,
          productId: v.product.id,
          sku: v.sku,
          name: v.product.name,
          qty: 5,
          remaining: 3,
          price: 400
        });
      } else if (v.sku === 'W0011') {
        // Rolex Sky Dweller Green&Gold:
        // - 1 bought at 375 (sold, remaining = 0)
        // - 3 bought at 350 (1 sold, 2 in stock, remaining = 2)
        batchesToCreate.push({
          variantId: v.id,
          productId: v.product.id,
          sku: v.sku,
          name: v.product.name,
          qty: 1,
          remaining: 0,
          price: 375
        });
        batchesToCreate.push({
          variantId: v.id,
          productId: v.product.id,
          sku: v.sku,
          name: v.product.name,
          qty: 3,
          remaining: 2,
          price: 350
        });
      } else if (v.sku === 'W0007') {
        // Tissot PRX Powermatic Black Dial:
        // - 1 bought at 185 (sold, remaining = 0)
        // - 1 bought at 200 (sold, remaining = 0)
        batchesToCreate.push({
          variantId: v.id,
          productId: v.product.id,
          sku: v.sku,
          name: v.product.name,
          qty: 1,
          remaining: 0,
          price: 185
        });
        batchesToCreate.push({
          variantId: v.id,
          productId: v.product.id,
          sku: v.sku,
          name: v.product.name,
          qty: 1,
          remaining: 0,
          price: 200
        });
      } else {
        // Regular non-split SKU
        const totalQty = availableStock + totalSold;
        if (totalQty > 0) {
          batchesToCreate.push({
            variantId: v.id,
            productId: v.product.id,
            sku: v.sku,
            name: v.product.name,
            qty: totalQty,
            remaining: availableStock,
            price: defaultSupplierPrice
          });
        }
      }
    }

    if (batchesToCreate.length === 0) {
      console.log(`No items found for supplier ${supplierName}. Skipping.`);
      continue;
    }

    // Calculate invoice totals
    const grandTotal = batchesToCreate.reduce((sum, b) => sum + (b.qty * b.price), 0);
    console.log(`Invoice Grand Total: EGP ${grandTotal} for ${batchesToCreate.length} batch items.`);

    // Perform database operations for this invoice and expense
    await prisma.$transaction(async (tx) => {
      // 1. Create Purchase Invoice
      const invoice = await tx.purchaseInvoice.create({
        data: {
          supplierId,
          invoiceNumber,
          issueDate: invoiceDate,
          status: 'POSTED',
          paymentStatus: 'PAID',
          subtotal: grandTotal,
          taxTotal: 0,
          shippingTotal: 0,
          discountTotal: 0,
          grandTotal,
          paidAmount: grandTotal,
          remainingAmount: 0,
          postedDate: invoiceDate
        }
      });

      // 2. Create Stock In Event
      const stockIn = await tx.stockInEvent.create({
        data: {
          invoiceId: invoice.id,
          warehouseId,
          postedAt: invoiceDate,
          postedBy: adminId
        }
      });

      // 3. Create Invoice Items and Inventory Batches
      for (const batch of batchesToCreate) {
        const item = await tx.purchaseInvoiceItem.create({
          data: {
            invoiceId: invoice.id,
            productId: batch.productId,
            variantId: batch.variantId,
            description: `شراء ساعة ${batch.name} (SKU: ${batch.sku})`,
            sku: batch.sku,
            quantity: batch.qty,
            unitCost: batch.price,
            finalUnitCost: batch.price,
            totalCost: batch.qty * batch.price
          }
        });

        await tx.inventoryBatch.create({
          data: {
            stockInId: stockIn.id,
            variantId: batch.variantId,
            initialQuantity: batch.qty,
            remainingQuantity: batch.remaining,
            unitCost: batch.price,
            purchaseItemId: item.id,
            createdAt: invoiceDate
          }
        });
      }

      // 4. Create Invoice Payment record
      await tx.invoicePayment.create({
        data: {
          invoiceId: invoice.id,
          amount: grandTotal,
          method: 'CASH',
          paidAt: invoiceDate,
          recordedBy: adminName
        }
      });

      // 5. Create Expense Record
      const expense = await tx.expense.create({
        data: {
          description: `مصروف مشتريات بضائع - فاتورة رقم ${invoiceNumber} من المورد ${supplierName}`,
          amount: grandTotal,
          date: invoiceDate,
          categoryId: expenseCategory!.id,
          status: 'PAID',
          paidBy: 'Cash (Office)',
          safeId: safeId,
          approvedBy: adminId,
          createdAt: invoiceDate
        }
      });

      // 6. Deduct Cash from Safe & create Safe Transaction
      currentSafeBalance -= grandTotal;
      await tx.safe.update({
        where: { id: safeId },
        data: { balance: currentSafeBalance }
      });

      await tx.safeTransaction.create({
        data: {
          safeId,
          type: 'DEBIT',
          amount: grandTotal,
          balanceAfter: currentSafeBalance,
          description: `سداد مصروف مشتريات بضائع - فاتورة رقم ${invoiceNumber}`,
          referenceType: 'EXPENSE',
          referenceId: expense.id,
          createdAt: invoiceDate,
          createdBy: adminId
        }
      });

      // 7. Create accounting Journal Entry (Dr Expense / Cr Cash on Hand)
      const journal = await tx.journalEntry.create({
        data: {
          description: `Expense: مشتريات بضائع - فاتورة رقم ${invoiceNumber}`,
          expenseId: expense.id,
          createdBy: adminId,
          date: invoiceDate,
          status: 'POSTED'
        }
      });

      // Dr Expense account
      await tx.transactionLine.create({
        data: {
          journalEntryId: journal.id,
          accountId: expenseAccount!.id,
          debit: grandTotal,
          credit: 0,
          description: `مصروف مشتريات بضائع - فاتورة رقم ${invoiceNumber}`
        }
      });
      await tx.account.update({
        where: { id: expenseAccount!.id },
        data: { balance: { increment: grandTotal } }
      });

      // Cr Cash on Hand (1000)
      currentCashAccountBalance -= grandTotal;
      await tx.transactionLine.create({
        data: {
          journalEntryId: journal.id,
          accountId: cashAccount.id,
          debit: 0,
          credit: grandTotal,
          description: `سداد مصروف مشتريات - فاتورة رقم ${invoiceNumber}`
        }
      });
      await tx.account.update({
        where: { id: cashAccount.id },
        data: { balance: currentCashAccountBalance }
      });

      // Link journal to expense
      await tx.expense.update({
        where: { id: expense.id },
        data: { journalEntryId: journal.id }
      });
    }, {
      timeout: 180000
    });

    console.log(`Successfully completed reconciliation for ${supplierName}.`);
  }

  console.log('\n=== RECONCILIATION SUMMARY ===');
  const finalSafe = await prisma.safe.findUnique({ where: { id: safeId } });
  const finalCashAccount = await prisma.account.findFirst({ where: { code: '1000' } });
  const finalInvoicesCount = await prisma.purchaseInvoice.count();
  const finalExpensesCount = await prisma.expense.count();

  console.log(`Final Safe Balance of "Cash (Office)": EGP ${finalSafe?.balance.toNumber()}`);
  console.log(`Final GL Cash Account Balance: EGP ${finalCashAccount?.balance.toNumber()}`);
  console.log(`Total Invoices Created: ${finalInvoicesCount}`);
  console.log(`Total Expenses Created: ${finalExpensesCount}`);
  console.log('========================================================');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
