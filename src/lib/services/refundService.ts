'use server';

import prisma from '@/lib/prisma';
import { auditService } from '@/lib/services/auditService';

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

    // Check refund window - use deliveredAt if available, fallback to createdAt
    const deliveredAt = order.deliveredAt || order.createdAt;
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
      // Note: This assumes full return. Partial returns need more complex logic.
      const warehouse = await tx.warehouse.findFirst();
      if (warehouse) {
        for (const item of returnRequest.order.items) {
          if (item.variantId) {
            await tx.inventory.updateMany({
              where: { 
                warehouseId: warehouse.id, 
                variantId: item.variantId 
              },
              data: { 
                available: { increment: item.quantity } 
              }
            });

            // Log inventory restoration
            await tx.inventoryLog.create({
              data: {
                warehouseId: warehouse.id,
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
      }

      // 3. Audit log
      await auditService.logAction(
        adminId,
        'REFUND_COMPLETED',
        'RETURN_REQUEST',
        returnRequestId,
        { 
          orderId: returnRequest.orderId,
          transactionReference 
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
