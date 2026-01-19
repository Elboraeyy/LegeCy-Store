import prisma from '@/lib/prisma';
import { createJournalEntry } from './revenueService';
import { ACCOUNTS } from '@/lib/constants/accounts';
import { inventoryService } from './inventoryService';
import { Prisma } from '@prisma/client';

export const purchaseOrderService = {
  /**
   * Create a Draft Purchase Invoice
   */
  async createInvoice(data: { 
      supplierId: string; 
      invoiceNumber: string; 
      issueDate: Date; 
      items: { variantId: string; quantity: number; unitCost: number }[] 
  }) {
      // Calculate totals
      let subtotal = 0;
      data.items.forEach(item => subtotal += item.quantity * item.unitCost);
      
      return await prisma.purchaseInvoice.create({
          data: {
              supplierId: data.supplierId,
              invoiceNumber: data.invoiceNumber,
              issueDate: data.issueDate,
              status: 'DRAFT',
              subtotal: new Prisma.Decimal(subtotal),
              taxTotal: 0, // Simplified
              shippingTotal: 0,
              discountTotal: 0,
              grandTotal: new Prisma.Decimal(subtotal),
              remainingAmount: new Prisma.Decimal(subtotal),
              items: {
                  create: data.items.map(item => ({
                      variantId: item.variantId,
                      description: 'Item', 
                      quantity: item.quantity,
                      unitCost: new Prisma.Decimal(item.unitCost),
                      finalUnitCost: new Prisma.Decimal(item.unitCost),
                      totalCost: new Prisma.Decimal(item.quantity * item.unitCost)
                  }))
              }
          }
      });
  },

  /**
   * Post Invoice:
   * 1. Lock Invoice (Status = POSTED)
   * 2. Increase Inventory (StockInEvent)
   * 3. Create Ledger Entry (Inv / AP)
   */
  async postInvoice(invoiceId: string, adminId: string) {
      return await prisma.$transaction(async (tx) => {
          const invoice = await tx.purchaseInvoice.findUnique({
              where: { id: invoiceId },
              include: { items: true, supplier: true }
          });

          if (!invoice || invoice.status !== 'DRAFT') throw new Error("Invalid invoice status");

          // 1. Create Stock In Event
          const stockIn = await tx.stockInEvent.create({
              data: {
                  invoiceId: invoice.id,
                  warehouseId: 'wh-main', // Default to Main for now, needs expansion
                  postedBy: adminId
              }
          });

          // 2. Process Items (Batches + Stock)
          for (const item of invoice.items) {
             if (!item.variantId) continue;
             
             // Create Batch
             await tx.inventoryBatch.create({
                 data: {
                     stockInId: stockIn.id,
                     variantId: item.variantId,
                     initialQuantity: item.quantity,
                     remainingQuantity: item.quantity,
                     unitCost: item.finalUnitCost,
                     purchaseItemId: item.id
                 }
             });

             // Increase Available Stock
             await inventoryService.increaseStock(tx, 'wh-main', item.variantId, item.quantity);
          }

          // 3. Create Ledger Entry (Debit Inventory, Credit AP)
          const grandTotal = Number(invoice.grandTotal);
          
          await createJournalEntry({
              description: `Purchase Invoice ${invoice.invoiceNumber} - ${invoice.supplier.name}`,
              reference: invoice.invoiceNumber,
              date: invoice.issueDate, 
              createdBy: adminId,
              lines: [
                  {
                      accountCode: ACCOUNTS.INVENTORY,
                      debit: grandTotal,
                      description: 'Inventory Purchase'
                  },
                  {
                      accountCode: ACCOUNTS.ACCOUNTS_PAYABLE,
                      credit: grandTotal,
                      description: `Payable to ${invoice.supplier.name}`
                  }
              ]
          });
          
          // 4. Update Invoice Status
          return await tx.purchaseInvoice.update({
              where: { id: invoiceId },
              data: {
                  status: 'POSTED',
                  postedDate: new Date()
              }
          });
      });
  },
  
  async getInvoices() {
      return await prisma.purchaseInvoice.findMany({
          orderBy: { createdAt: 'desc' },
          include: { supplier: true }
      });
  }
};
