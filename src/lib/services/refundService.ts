'use server';

import prisma from '@/lib/prisma';
import { auditService } from '@/lib/services/auditService';
import { OrderItem } from '@prisma/client';
import { ACCOUNTS } from '@/lib/constants/accounts';
import { getStoreConfig } from '@/lib/actions/config';

/**
 * Refund Service
 * 
 * Handles return request processing and refund workflows.
 * Note: Actual Paymob refund API integration should be added when ready.
 */

export type RefundEligibility = {
  eligible: boolean;
  reason?: string;
  maxRefundAmount?: number;
  daysRemaining?: number;
};

export type RefundResult = {
  success: boolean;
  message?: string;
  refundAmount?: number;
  requiresManualProcessing?: boolean;
};

// Configurable refund window (days after delivery)
const REFUND_WINDOW_DAYS = 14;

/**
 * Check if an order is eligible for refund
 */
export async function checkRefundEligibility(orderId: string): Promise<RefundEligibility> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        returnRequest: true,
        paymentIntent: true
      }
    });

    if (!order) {
      return { eligible: false, reason: 'Order not found' };
    }

    // Must be delivered
    if (order.status !== 'delivered') {
      return { eligible: false, reason: 'Only delivered orders can be refunded' };
    }

    // Check if return request already exists
    if (order.returnRequest) {
      return { 
        eligible: false, 
        reason: `Return request already exists (status: ${order.returnRequest.status})` 
      };
    }

    // Check refund window - use deliveredAt if available, fallback to updatedAt (approximate success time)
    // using createdAt is unfair as it includes shipping time
    const deliveredAt = order.deliveredAt || order.updatedAt;
    const daysSinceDelivery = Math.floor(
      (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDelivery > REFUND_WINDOW_DAYS) {
      return { 
        eligible: false, 
        reason: `Refund window expired (${REFUND_WINDOW_DAYS} days)` 
      };
    }

    return {
      eligible: true,
      maxRefundAmount: Number(order.totalPrice),
      daysRemaining: REFUND_WINDOW_DAYS - daysSinceDelivery
    };

  } catch (error) {
    console.error('Refund eligibility check failed:', error);
    return { eligible: false, reason: 'System error checking eligibility' };
  }
}

/**
 * Approve a return request and prepare for refund
 */
export async function approveReturnRequest(
  returnRequestId: string, 
  adminId: string,
  refundAmount?: number
): Promise<RefundResult> {
  try {
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: { 
        order: { 
          include: { 
            items: true,
            paymentIntent: true 
          } 
        } 
      }
    });

    if (!returnRequest) {
      return { success: false, message: 'Return request not found' };
    }

    if (returnRequest.status !== 'pending') {
      return { success: false, message: `Cannot approve: status is ${returnRequest.status}` };
    }

    const order = returnRequest.order;
    const calculatedRefund = refundAmount || Number(order.totalPrice);

    // Validate refund amount
    if (calculatedRefund > Number(order.totalPrice)) {
      return { success: false, message: 'Refund amount exceeds order total' };
    }

    // Update return request status
    await prisma.$transaction(async (tx) => {
      // 1. Update return request
      await tx.returnRequest.update({
        where: { id: returnRequestId },
        data: { 
          status: 'approved',
          adminNote: `Approved by admin. Refund amount: ${calculatedRefund} EGP`
        }
      });

      // 2. Log audit
      await auditService.logAction(
        adminId,
        'REFUND_APPROVED',
        'RETURN_REQUEST',
        returnRequestId,
        {
          orderId: order.id,
          refundAmount: calculatedRefund,
          paymentMethod: order.paymentMethod
        },
        null,
        null,
        tx
      );
    });

    // Determine if manual processing needed
    const requiresManual = order.paymentMethod === 'cod' || !order.paymentIntent;

    return {
      success: true,
      message: requiresManual 
        ? 'Refund approved. Manual processing required (COD order).' 
        : 'Refund approved. Process via payment gateway.',
      refundAmount: calculatedRefund,
      requiresManualProcessing: requiresManual
    };

  } catch (error) {
    console.error('Refund approval failed:', error);
    return { success: false, message: 'System error processing refund' };
  }
}

/**
 * Reject a return request
 */
export async function rejectReturnRequest(
  returnRequestId: string,
  adminId: string,
  reason: string
): Promise<RefundResult> {
  try {
    if (!reason || reason.length < 10) {
      return { success: false, message: 'Rejection reason is required (min 10 characters)' };
    }

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: { order: true }
    });

    if (!returnRequest) {
      return { success: false, message: 'Return request not found' };
    }

    if (returnRequest.status !== 'pending') {
      return { success: false, message: `Cannot reject: status is ${returnRequest.status}` };
    }

    await prisma.$transaction(async (tx) => {
      await tx.returnRequest.update({
        where: { id: returnRequestId },
        data: { 
          status: 'rejected',
          adminNote: reason
        }
      });

      await auditService.logAction(
        adminId,
        'REFUND_REJECTED',
        'RETURN_REQUEST',
        returnRequestId,
        { 
          orderId: returnRequest.orderId,
          reason 
        },
        null,
        null,
        tx
      );
    });

    return { success: true, message: 'Return request rejected' };

  } catch (error) {
    console.error('Refund rejection failed:', error);
    return { success: false, message: 'System error processing rejection' };
  }
}

/**
 * Complete a refund (mark as completed after manual processing or API call)
 */
export async function completeRefund(
  returnRequestId: string,
  adminId: string,
  transactionReference?: string
): Promise<RefundResult> {
  try {
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: { order: { include: { items: true } } }
    });

    if (!returnRequest) {
      return { success: false, message: 'Return request not found' };
    }

    if (returnRequest.status !== 'approved') {
      return { success: false, message: 'Only approved requests can be completed' };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Mark as completed
      await tx.returnRequest.update({
        where: { id: returnRequestId },
        data: { 
          status: 'completed',
          adminNote: transactionReference 
            ? `Refund completed. Ref: ${transactionReference}`
            : 'Refund completed (manual)'
        }
      });

      // 2. Restore inventory for returned items
      // AUDIT FIX: Use item-level warehouseId, fallback to MAIN warehouse for legacy items
      let legacyWarehouseId: string | null = null;

      for (const item of returnRequest.order.items) {
        if (item.variantId) {
          // Get correct warehouse for this item
          let targetWarehouseId = (item as any).warehouseId as string | null;

          // Fallback for legacy orders without warehouseId
          if (!targetWarehouseId) {
            if (!legacyWarehouseId) {
              const w = await tx.warehouse.findFirst({ where: { type: 'MAIN', isActive: true } })
                || await tx.warehouse.findFirst({ where: { isActive: true } });
              legacyWarehouseId = w?.id || null;
            }
            targetWarehouseId = legacyWarehouseId;
          }

          if (!targetWarehouseId) {
            throw new Error('No warehouse configured. Cannot restore inventory.');
          }

          // First check if inventory record exists
          const existingInventory = await tx.inventory.findFirst({
            where: {
              warehouseId: targetWarehouseId,
              variantId: item.variantId
            }
          });

          if (!existingInventory) {
            // Create inventory record if it doesn't exist (edge case for legacy items)
            await tx.inventory.create({
              data: {
                warehouseId: targetWarehouseId,
                variantId: item.variantId,
                available: item.quantity,
                reserved: 0
              }
            });
            console.log('[RefundService] Created missing inventory record for variant', { variantId: item.variantId });
          } else {
            // Update existing inventory
            const updateResult = await tx.inventory.updateMany({
              where: { 
                warehouseId: targetWarehouseId, 
                variantId: item.variantId 
              },
              data: { 
                available: { increment: item.quantity } 
              }
            });

            // CRITICAL: Verify the update succeeded
            if (updateResult.count === 0) {
              throw new Error(`Failed to restore inventory for variant ${item.variantId}. Inventory record may have been deleted during transaction.`);
            }
          }

          // Log inventory restoration
          await tx.inventoryLog.create({
            data: {
              warehouseId: targetWarehouseId,
              variantId: item.variantId,
              action: 'RETURN',
              quantity: item.quantity,
              reason: `Refund completed for order ${returnRequest.orderId}`,
              referenceId: returnRequest.orderId,
              adminId
            }
          });
        }
      }

      // 3. CRITICAL: Create reversing journal entry for financial accuracy
      // This reverses the revenue for returned items only (with proportional discount)
      const returnedItems = returnRequest.items as Array<{ id: string; quantity: number }> | null;
      let refundAmount = 0;
      let cogsToReverse = 0;

      if (returnedItems && returnedItems.length > 0) {
        // Calculate refund from returned items using discounted prices
        for (const ri of returnedItems) {
          const orderItem = returnRequest.order.items.find(i => i.id === ri.id);
          if (orderItem) {
            // Use discounted price if available, otherwise original price
            const itemWithDiscount = orderItem as unknown as OrderItem;
            const pricePerUnit = itemWithDiscount.discountedPrice
              ? Number(itemWithDiscount.discountedPrice)
              : Number(orderItem.price);
            refundAmount += pricePerUnit * ri.quantity;

            // Calculate COGS to reverse (if cost tracked)
            if (orderItem.costAtPurchase) {
              cogsToReverse += Number(orderItem.costAtPurchase) * ri.quantity;
            }
          }
        }
      } else {
        // Fallback for orders without item-level return tracking (legacy)
        refundAmount = Number(returnRequest.order.totalPrice);
        // Unable to accurately determine COGS for legacy full refund without item details, skipping COGS reversal to avoid bad data
      }
      
      // Find the original revenue journal entry
      const originalJournal = await tx.journalEntry.findFirst({
        where: { orderId: returnRequest.orderId }
      });

      // Only create reversal if original journal exists
      if (originalJournal) {
        // Get accounts using correct codes from ACCOUNTS constants
        const salesAccount = await tx.account.findFirst({ where: { code: ACCOUNTS.SALES_REVENUE } }); // 4000 - Sales Revenue
        const cashAccount = await tx.account.findFirst({ where: { code: ACCOUNTS.CASH } }); // 1000 - Cash

        if (!salesAccount || !cashAccount) {
          console.error('[RefundService] CRITICAL: Required accounts not found!', {
            salesAccountCode: ACCOUNTS.SALES_REVENUE,
            cashAccountCode: ACCOUNTS.CASH,
            salesAccountFound: !!salesAccount,
            cashAccountFound: !!cashAccount
          });
          throw new Error('Required accounts for refund reversal not found. Please ensure Chart of Accounts is properly seeded.');
        }

        // Create reversing journal entry for Revenue
        const reversalJournal = await tx.journalEntry.create({
          data: {
            description: `Refund Reversal for Order #${returnRequest.orderId.slice(0, 8)}`,
            reference: `REFUND-${returnRequestId.slice(0, 8)}`,
            date: new Date(),
            status: 'POSTED',
            createdBy: adminId,
            orderId: returnRequest.orderId
          }
        });

        // Line 1: Debit Sales Revenue (reverse the credit)
        await tx.transactionLine.create({
          data: {
            journalEntryId: reversalJournal.id,
            accountId: salesAccount.id,
            debit: refundAmount,
            credit: 0,
            description: 'Sales Revenue Reversal (Refund)'
          }
        });
        // Update sales account balance (decrease)
        await tx.account.update({
          where: { id: salesAccount.id },
          data: { balance: { decrement: refundAmount } }
        });

        // Line 2: Credit Cash (reverse the debit)
        await tx.transactionLine.create({
          data: {
            journalEntryId: reversalJournal.id,
            accountId: cashAccount.id,
            debit: 0,
            credit: refundAmount,
            description: 'Cash Reversal (Refund Paid Out)'
          }
        });
        // Update cash account balance (decrease)
        await tx.account.update({
          where: { id: cashAccount.id },
          data: { balance: { decrement: refundAmount } }
        });

        // Line 3: Debit Sales Tax Payable (reverse the tax liability) - CRITICAL FIX
        const taxAccount = await tx.account.findFirst({ where: { code: ACCOUNTS.SALES_TAX_PAYABLE } });
        if (taxAccount) {
          // Get tax rate from store config
          let taxRate = 0;
          try {
            const taxSettings = await getStoreConfig('tax_settings');
            if (taxSettings && typeof taxSettings === 'object' && 'taxRate' in taxSettings) {
              taxRate = Number((taxSettings as { taxRate: number }).taxRate) / 100;
            }
          } catch {
            // Silent fail - use 0% tax
          }

          // Calculate proportional tax reversal
          const taxToReverse = taxRate > 0 ? refundAmount - (refundAmount / (1 + taxRate)) : 0;

          if (taxToReverse > 0) {
            await tx.transactionLine.create({
              data: {
                journalEntryId: reversalJournal.id,
                accountId: taxAccount.id,
                debit: taxToReverse,
                credit: 0,
                description: 'Tax Liability Reversal (Refund)'
              }
            });
            // Update tax account balance (decrease liability)
            await tx.account.update({
              where: { id: taxAccount.id },
              data: { balance: { decrement: taxToReverse } }
            });
          }
        }

        // ==========================================
        // COGS Reversal (Inventory Asset Restoration)
        // ==========================================
        if (cogsToReverse > 0) {
          const inventoryAccount = await tx.account.findFirst({ where: { code: ACCOUNTS.INVENTORY } });
          const cogsAccount = await tx.account.findFirst({ where: { code: ACCOUNTS.COGS } });

          if (inventoryAccount && cogsAccount) {
            // Create separate journal entry for COGS to keep ledgers clean
            const cogsJournal = await tx.journalEntry.create({
              data: {
                description: `COGS Reversal for Refund #${returnRequest.orderId.slice(0, 8)}`,
                reference: `COGS-REV-${returnRequestId.slice(0, 8)}`,
                date: new Date(),
                // Using same status
                status: 'POSTED',
                createdBy: adminId,
                orderId: returnRequest.orderId
              }
            });

            // Debit Inventory (Asset Increase)
            await tx.transactionLine.create({
              data: {
                journalEntryId: cogsJournal.id,
                accountId: inventoryAccount.id,
                debit: cogsToReverse,
                credit: 0,
                description: 'Inventory Value Restoration'
              }
            });
            await tx.account.update({
              where: { id: inventoryAccount.id },
              data: { balance: { increment: cogsToReverse } }
            });

            // Credit COGS (Expense Decrease)
            await tx.transactionLine.create({
              data: {
                journalEntryId: cogsJournal.id,
                accountId: cogsAccount.id,
                debit: 0,
                credit: cogsToReverse,
                description: 'COGS Reversal'
              }
            });
            await tx.account.update({
              where: { id: cogsAccount.id },
              data: { balance: { decrement: cogsToReverse } }
            });

            console.log('[RefundService] COGS Reversal created', { cogsToReverse });
          }
        }

        console.log('[RefundService] Refund reversal journal entry created', {
          journalId: reversalJournal.id,
          refundAmount,
          cogsReversed: cogsToReverse,
          orderId: returnRequest.orderId
        });
      }

      // 4. Audit log
      await auditService.logAction(
        adminId,
        'REFUND_COMPLETED',
        'RETURN_REQUEST',
        returnRequestId,
        { 
          orderId: returnRequest.orderId,
          refundAmount,
          transactionReference,
          ledgerReversalCreated: !!originalJournal
        },
        null,
        null,
        tx
      );
    });

    return { 
      success: true, 
      message: 'Refund completed and inventory restored' 
    };

  } catch (error) {
    console.error('Refund completion failed:', error);
    return { success: false, message: 'System error completing refund' };
  }
}
