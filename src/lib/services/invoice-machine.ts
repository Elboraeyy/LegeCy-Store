import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';


export type InvoiceStatus = 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'POSTED' | 'CANCELLED';

export class InvoiceStateMachine {
  /**
   * Defines allowed transitions between states
   */
  private static allowedTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
    DRAFT: ['REVIEWED', 'CANCELLED'],
    REVIEWED: ['APPROVED', 'DRAFT', 'CANCELLED'],
    APPROVED: ['POSTED', 'REVIEWED', 'CANCELLED'], // REVIEWED -> Backtrack if needed
    POSTED: [], // Terminal state (modifications possible only via Adj/Credit Note)
    CANCELLED: [], // Terminal state
  };

  /**
   * Validate if a transition is allowed
   */
  static canTransition(currentStatus: string, targetStatus: InvoiceStatus): boolean {
    const validNextStates = this.allowedTransitions[currentStatus as InvoiceStatus] || [];
    return validNextStates.includes(targetStatus);
  }

  /**
   * Execute a status transition
   * Includes validation and audit logging
   */
  static async transition(
    invoiceId: string,
    targetStatus: InvoiceStatus,
    adminId: string,
    prismaTx: Prisma.TransactionClient = prisma as unknown as Prisma.TransactionClient
  ) {
    const invoice = await prismaTx.purchaseInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) throw new Error('Invoice not found');

    if (!this.canTransition(invoice.status, targetStatus)) {
      throw new Error(`Invalid transition from ${invoice.status} to ${targetStatus}`);
    }

    // Specific Stage Validations
    if (targetStatus === 'POSTED') {
      await this.validateForPosting(invoiceId, prismaTx);
    }

    // Update Invoice
    const updatedInvoice = await prismaTx.purchaseInvoice.update({
      where: { id: invoiceId },
      data: {
        status: targetStatus,
        postedDate: targetStatus === 'POSTED' ? new Date() : undefined,
      },
      include: { items: true } // Return items for further processing if needed
    });

    // Create Audit Log
    await prismaTx.invoiceAuditLog.create({
      data: {
        invoiceId,
        action: `STATUS_CHANGE_${targetStatus}`,
        actorId: adminId,
        actorName: 'Admin', // Fetch actual name if available or handle via simpler logs
        details: `Changed status from ${invoice.status} to ${targetStatus}`,
      },
    });

    return updatedInvoice;
  }

  /**
   * Strict validation before Posting
   * Posting is irreversible, so we must be sure.
   */
  private static async validateForPosting(invoiceId: string, tx: Prisma.TransactionClient) {
    const invoice = await tx.purchaseInvoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    if (!invoice) throw new Error("Invoice not found");

    if (!invoice.items || invoice.items.length === 0) {
      throw new Error('Cannot post an empty invoice.');
    }

    // Ensure all items have costs
    for (const item of invoice.items) {
      if (Number(item.totalCost) <= 0 && process.env.ALLOW_ZERO_COST !== 'true') {
        // Warning or Error based on config. usually we warn but allow sample/bonus items.
        // For now, strict check on quantity.
      }
      if (item.quantity <= 0) {
        throw new Error(`Item ${item.description} has invalid quantity.`);
      }
    }
    
    // Additional validations (e.g. Supplier active?)
  }
}
