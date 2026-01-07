import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class FinancialIntegrator {
  
  /**
   * Records the financial impact of posting an invoice.
   * Debit: Inventory Asset (or Expense)
   * Credit: Accounts Payable
   */
  static async postInvoiceToLedger(invoiceId: string, adminId: string, tx: Prisma.TransactionClient = prisma as unknown as Prisma.TransactionClient) {
    const invoice = await tx.purchaseInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) throw new Error("Invoice not found");

    // 1. Create Ledger Event (Double Entry Simulation)
    // Credit AP
    await tx.invoiceLedgerEvent.create({
      data: {
        invoiceId,
        type: 'PURCHASE_POST',
        amount: invoice.grandTotal,
        debitAccount: 'INVENTORY_ASSET', // Simplification
        creditAccount: 'ACCOUNTS_PAYABLE',
      }
    });

    // 2. Create or Update Accounts Payable Record
    // Check if AP record exists (it shouldn't for a new post, but safe to check)
    // We create a new AP entry for each invoice to track aging properly
    await tx.accountsPayable.create({
      data: {
        supplierId: invoice.supplierId,
        invoiceId: invoice.id,
        amount: invoice.remainingAmount, // Initially full amount (or partial if prepaid, handled separately)
        dueDate: invoice.dueDate,
        status: invoice.remainingAmount.equals(0) ? 'CLEARED' : 'OPEN',
      }
    });

    // 3. Update Supplier Balance
    await tx.supplier.update({
      where: { id: invoice.supplierId },
      data: {
        accountBalance: { increment: invoice.remainingAmount }
      }
    });
  }

  /**
   * Process a payment for an invoice
   */
  static async recordPayment(
    invoiceId: string, 
    amount: number, 
    treasuryAccountId: string,
    method: string,
    reference: string,
    adminId: string,
    tx: Prisma.TransactionClient = prisma as unknown as Prisma.TransactionClient
  ) {
    const invoice = await tx.purchaseInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error("Invoice not found");

    if (Number(invoice.remainingAmount) < amount) {
      throw new Error(`Payment amount ${amount} exceeds remaining balance ${invoice.remainingAmount}`);
    }

    // 1. Create Payment Record
    const payment = await tx.invoicePayment.create({
      data: {
        invoiceId,
        amount,
        method,
        reference,
        treasuryAccountId,
        recordedBy: adminId,
      }
    });

    // 2. Update Invoice Status
    const newPaid = Number(invoice.paidAmount) + amount;
    const newRemaining = Number(invoice.grandTotal) - newPaid;
    const newStatus = newRemaining <= 0.01 ? 'PAID' : 'PARTIAL'; // Float tolerance

    await tx.purchaseInvoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        paymentStatus: newStatus,
        status: newStatus === 'PAID' && invoice.status === 'POSTED' ? 'SETTLED' : invoice.status
      }
    });

    // 3. Update Accounts Payable
    // Find the specific AP entry for this invoice
    const apEntry = await tx.accountsPayable.findFirst({
        where: { invoiceId }
    });

    if (apEntry) {
        await tx.accountsPayable.update({
            where: { id: apEntry.id },
            data: {
                amount: { decrement: amount },
                status: newRemaining <= 0.01 ? 'CLEARED' : 'OPEN'
            }
        });
    }

    // 4. Update Treasury and Supplier Balance
    await tx.treasuryAccount.update({
        where: { id: treasuryAccountId },
        data: { balance: { decrement: amount } }
    });

    await tx.supplier.update({
        where: { id: invoice.supplierId },
        data: { accountBalance: { decrement: amount } }
    });
    
    // 5. Ledger (Payment)
    await tx.invoiceLedgerEvent.create({
        data: {
            invoiceId,
            type: 'PAYMENT',
            amount: new Decimal(amount),
            debitAccount: 'ACCOUNTS_PAYABLE',
            creditAccount: 'TREASURY_CASH',
        }
    });

    return payment;
  }
}
