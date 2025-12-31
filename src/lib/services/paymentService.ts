import { Prisma } from '@prisma/client';
import prisma from '../prisma';
import { inventoryService } from './inventoryService';
import { getDefaultWarehouseId, internalCancelOrder } from './orderService';
import { OrderStatus } from '../orderStatus';
import { PaymentError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const RESERVATION_TTL_MINUTES = parseInt(process.env.RESERVATION_TTL_MINUTES || '15', 10);

export const PaymentIntentStatus = {
    Pending: 'pending',
    Succeeded: 'succeeded',
    Failed: 'failed',
    Expired: 'expired'
} as const;

export type PaymentIntentStatusType = typeof PaymentIntentStatus[keyof typeof PaymentIntentStatus];

export async function createPaymentIntent(tx: Prisma.TransactionClient, orderId: string, amount: number) {
    const expiresAt = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);
    
    return await tx.paymentIntent.create({
        data: {
            orderId,
            amount,
            status: PaymentIntentStatus.Pending,
            expiresAt,
            provider: 'manual' // Default for now
        }
    });
}

/**
 * Confirm a payment intent.
 * This is the ONLY way an order becomes Paid.
 * Commits stock and updates Order status.
 */
export async function confirmPaymentIntent(intentId: string) {
    return await prisma.$transaction(async (tx) => {
        // 1. Fetch & Verify Intent
        const intent = await tx.paymentIntent.findUnique({
            where: { id: intentId },
            include: { order: { include: { items: true } } }
        });

        if (!intent) throw new PaymentError('Payment Intent not found');
        if (intent.status !== PaymentIntentStatus.Pending) throw new PaymentError(`Payment is already ${intent.status}`);
        
        if (intent.expiresAt < new Date()) {
            throw new PaymentError('Payment Intent has expired');
        }

        // Amount Check (CRITICAL)
        const intentAmount = intent.amount.toNumber();
        const orderTotal = intent.order.totalPrice.toNumber();
        
        if (Math.abs(intentAmount - orderTotal) > 0.01) { 
             throw new PaymentError(`Payment amount mismatch: Intent=${intentAmount}, Order=${orderTotal}`);
        }

        // 2. Mark Intent Succeeded
        await tx.paymentIntent.update({
            where: { id: intentId },
            data: { status: PaymentIntentStatus.Succeeded }
        });

        // 3. Mark Order Paid (Strictly internal)
        await tx.order.update({
            where: { id: intent.orderId },
            data: { status: OrderStatus.Paid }
        });
        
        // 4. Commit Inventory
        const warehouseId = await getDefaultWarehouseId(tx);
        for (const item of intent.order.items) {
            if (item.variantId) {
                await inventoryService.commitStock(tx, warehouseId, item.variantId, item.quantity);
            }
        }

        // 5. Log History
        await tx.orderStatusHistory.create({
            data: {
                orderId: intent.orderId,
                from: OrderStatus.Pending,
                to: OrderStatus.Paid,
                reason: 'Payment Confirmed'
            }
        });

        // 6. Audit Log (Actor = SYSTEM for webhook confirmations)
        const { auditService } = await import('@/lib/services/auditService');
        await auditService.logAction(
            'SYSTEM', // Actor is system for webhook-triggered changes
            'PAYMENT_CONFIRMED',
            'ORDER',
            intent.orderId,
            {
                paymentIntentId: intent.id,
                amount: intentAmount,
                provider: intent.provider,
                providerReference: intent.providerReference
            },
            null, // No IP for webhooks
            null, // No UA for webhooks
            tx
        );

        return { success: true };
    });
}

/**
 * Handle failed or expired payment.
 * Cancels the order and releases stock.
 */
export async function failPaymentIntent(intentId: string, reason: string = 'Payment Failed') {
    return await prisma.$transaction(async (tx) => {
        const intent = await tx.paymentIntent.findUnique({
            where: { id: intentId },
            include: { order: true }
        });

        if (!intent) return;
        if (intent.status !== PaymentIntentStatus.Pending) return; // Idempotency

        // 1. Mark Intent Failed/Expired
        const newStatus = reason === 'Reservation Expired' ? PaymentIntentStatus.Expired : PaymentIntentStatus.Failed;
        
        await tx.paymentIntent.update({
            where: { id: intentId },
            data: { status: newStatus } 
        });

        // 2. Cancel Order
        await internalCancelOrder(tx, intent.orderId, `Payment Failed: ${reason}`);
        
        return { success: true };
    });
}


/**
 * Worker Function: Scans for expired PaymentIntents and fails them.
 */
export async function processExpiredPayments() {
    const now = new Date();
    const expiredIntents = await prisma.paymentIntent.findMany({
        where: { status: PaymentIntentStatus.Pending, expiresAt: { lt: now } },
        select: { id: true }
    });

    if (expiredIntents.length === 0) return 0;
    
    let count = 0;
    for (const intent of expiredIntents) {
        try {
            await failPaymentIntent(intent.id, 'Reservation Expired');
            count++;
        } catch (e) {
            logger.error(`[Cleanup] Failed to process intent ${intent.id}`, { error: e });
        }
    }
    return count;
}

/**
 * Worker Function: Scans for "Zombie" orders (Pending, Created > 30m ago, No PaymentIntent)
 * These are abandoned checkouts.
 */
export async function processZombieOrders() {
    const ZOMBIE_THRESHOLD_MINUTES = 30;
    const threshold = new Date(Date.now() - ZOMBIE_THRESHOLD_MINUTES * 60 * 1000);

    const zombies = await prisma.order.findMany({
        where: {
            status: OrderStatus.Pending,
            createdAt: { lt: threshold },
            paymentIntent: { is: null }, // Prisma syntax for checking null relation
            // CRITICAL: Exclude COD orders - they should not be auto-cancelled
            // COD orders don't have PaymentIntent but are valid orders
            paymentMethod: { not: 'cod' }
        },
        select: { id: true }
    });

    if (zombies.length === 0) return 0;

    let count = 0;
    for (const zombie of zombies) {
        try {
            await prisma.$transaction(async (tx) => {
                 await internalCancelOrder(tx, zombie.id, 'Abandoned Checkout (Zombie)');
            });
            count++;
        } catch (e) {
            logger.error(`[Cleanup] Failed to crush zombie order ${zombie.id}`, { error: e });
        }
    }
    return count;
}
