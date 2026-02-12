

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { orderFinancialService } from './orderFinancialService';
import { orderNotificationService } from './orderNotificationService';
import { inventoryService } from '@/lib/services/inventoryService';
import { revenueService } from '@/lib/services/revenueService';
import { awardPoints, refundRedeemedPoints } from '@/lib/services/loyaltyService';
import { logger } from '@/lib/logger';
import { validateOrderTransition, ActorRole } from '@/lib/policies/orderPolicy';
import { OrderStatus } from '@/types/order';

export type OrderEventType = 'CREATED' | 'CONFIRMED' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

interface OrderEventInput {
    orderId: string;
    eventType: OrderEventType;
    fromStatus?: string;
    toStatus?: string;
    amount?: number;
    reason?: string;
    triggeredBy?: string;
    metadata?: Record<string, unknown>;
}

export const orderStateService = {
    /**
     * Centralized method to transition an order status and trigger all side effects
     */
    async transitionOrder(params: {
        orderId: string;
        newStatus: OrderStatus;
        actor: ActorRole;
        actorId?: string;
        reason?: string;
        metadata?: Record<string, unknown>;
    }) {
        const { orderId, newStatus, actor, actorId, reason, metadata } = params;

        const postCommitActions: (() => Promise<void>)[] = [];

        try {
            return await prisma.$transaction(async (tx) => {
            // 1. Fetch Order
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true, revenueRecognition: true }
            });

            if (!order) throw new Error(`Order ${orderId} not found`);
            const currentStatus = order.status as OrderStatus;

            // 2. Validate Transition
            validateOrderTransition(currentStatus, newStatus, actor);

            // 3. Update Order Status
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: newStatus,
                    ...(newStatus === OrderStatus.Delivered && { deliveredAt: new Date() })
                }
            });

            // 4. Record Lifecycle Event (Side effects triggered after)
            await this.recordOrderEvent({
                orderId,
                eventType: this._mapStatusToEventType(newStatus),
                fromStatus: currentStatus,
                toStatus: newStatus,
                reason,
                triggeredBy: actorId || actor,
                metadata
            }, tx);

            // 5. Status-specific Side Effects via helpers
            if (newStatus === OrderStatus.Cancelled) {
                await this._handleCancellation(orderId, actorId, reason, tx);
            } else if (newStatus === OrderStatus.Refunded) {
                // For simplified full refund on status change. Partial refunds should use a separate method.
                const total = Number(order.totalPrice);
                await this._handleRefund(orderId, total, actorId, reason, tx);
            } else if (newStatus === OrderStatus.Delivered) {
                // Loyalty Points
                if (order.userId) {
                    await awardPoints({
                        userId: order.userId,
                        orderId,
                        orderTotal: Number(order.totalPrice)
                    });
                }
            }

                // 6. Queue Post-Commit Notifications
                if (newStatus === OrderStatus.Shipped) {
                    postCommitActions.push(() => orderNotificationService.notifyShipped(orderId, metadata));
                } else if (newStatus === OrderStatus.Delivered) {
                    postCommitActions.push(() => orderNotificationService.notifyDelivered(orderId));
                }

            return { success: true };
            }, {
                timeout: 30000 // 30 seconds
        });
        } finally {
            // Run side effects outside the transaction
            for (const action of postCommitActions) {
                await action().catch(e => logger.error(`[PostCommit] Action failed`, e));
            }
        }
    },

    /**
     * Record event and trigger side effects
     * Supports external transaction
     */
    async recordOrderEvent(input: OrderEventInput, txClient?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
        const { orderId, eventType, fromStatus, toStatus, amount, reason, triggeredBy, metadata } = input;
        const db = txClient || prisma;

        // 1. Audit Log in DB
        await db.orderEvent.create({
            data: {
                orderId, eventType, fromStatus, toStatus,
                amount: amount ? new Decimal(amount) : null,
                reason, triggeredBy,
                metadata: metadata as Prisma.InputJsonValue,
            }
        });

        // 2. Trigger Financial / Notification Side Effects
        switch (eventType) {
            case 'PAID':
                // For Online payments, record payment source entry (xazna)
                if (toStatus === OrderStatus.Pending || toStatus === OrderStatus.Paid) {
                    const order = await db.order.findUnique({ where: { id: orderId } });
                    if (order && order.paymentMethod !== 'cod') {
                        if (fromStatus === OrderStatus.PaymentPending || toStatus === OrderStatus.Paid) {
                            await orderFinancialService.recordPaymentReceipt(orderId);
                        }
                    }
                }
                break;
            case 'SHIPPED':
                // Move notification outside or trigger if NOT in transaction
                if (!txClient) {
                    await orderNotificationService.notifyShipped(orderId, metadata);
                }
                break;
            case 'DELIVERED':
                // For COD orders, record payment source entry (xazna) upon delivery
                const order = await db.order.findUnique({ where: { id: orderId } });
                if (order && order.paymentMethod === 'cod') {
                    await orderFinancialService.recordPaymentReceipt(orderId);
                }

                await orderFinancialService.recognizeRevenue(orderId, triggeredBy);

                // Move notification outside or trigger if NOT in transaction
                if (!txClient) {
                    await orderNotificationService.notifyDelivered(orderId);
                }
                break;
        }

        logger.info(`[OrderState] Event recorded: ${eventType} for ${orderId}`);
    },

    _mapStatusToEventType(status: OrderStatus): OrderEventType {
        const mapping: Record<string, OrderEventType> = {
            [OrderStatus.PaymentPending]: 'CREATED', // Initial state for Online
            [OrderStatus.Pending]: 'PAID', // Payment Verified (Online) OR Created (COD) - Context matters
            [OrderStatus.Confirmed]: 'CONFIRMED',
            [OrderStatus.Paid]: 'PAID', // Deprecated for Online, but keep
            [OrderStatus.Shipped]: 'SHIPPED',
            [OrderStatus.Delivered]: 'DELIVERED',
            [OrderStatus.Cancelled]: 'CANCELLED',
            [OrderStatus.Refunded]: 'REFUNDED'
        };
        return mapping[status] || 'CONFIRMED';
    },

    async _handleCancellation(orderId: string, triggeredBy?: string, reason?: string, txClient?: Prisma.TransactionClient) {
        const db = txClient || prisma;
        const order = await db.order.findUnique({
            where: { id: orderId },
            include: { items: true, revenueRecognition: true }
        });
        if (!order) return;

        // 1. Reverse Financials
        if (order.revenueRecognition) {
            await revenueService.reverseRevenue(orderId, reason || 'Order cancelled');
            await db.revenueRecognition.delete({ where: { orderId } });
        }

        // 2. Refund Loyalty Points
        if (order.userId) {
            await refundRedeemedPoints({ userId: order.userId, orderId });
        }

        // 3. Release Stock
        for (const item of order.items) {
            if (item.variantId) {
                const warehouseId = (item as { warehouseId?: string | null }).warehouseId || (await this._getDefaultWarehouseId(db));
                if (warehouseId) {
                    await inventoryService.releaseStock(db, warehouseId, item.variantId, item.quantity);
                    await db.inventoryLog.create({
                        data: {
                            warehouseId,
                            variantId: item.variantId,
                            action: 'CANCEL',
                            quantity: item.quantity,
                            reason: `Order cancelled: ${reason}`,
                            referenceId: orderId,
                            adminId: triggeredBy
                        }
                    });
                }
            }
        }
    },

    async _handleRefund(orderId: string, amount: number, triggeredBy?: string, reason?: string, txClient?: Prisma.TransactionClient) {
        const db = txClient || prisma;
        const order = await db.order.findUnique({
            where: { id: orderId },
            include: { items: true, revenueRecognition: true }
        });
        if (!order || !order.revenueRecognition) return;

        // Proportional reversal logic
        const orderTotal = new Decimal(order.totalPrice);
        const refundAmount = new Decimal(amount);
        const ratio = orderTotal.gt(0) ? refundAmount.div(orderTotal) : new Decimal(0);

        const rec = order.revenueRecognition;
        const taxRev = new Decimal(rec.taxAmount || 0).mul(ratio);
        const netRev = new Decimal(rec.netRevenue).mul(ratio);
        const cogsRev = new Decimal(rec.cogsAmount).mul(ratio);

        await revenueService.createRefundEntry(orderId, netRev, cogsRev, reason, taxRev);

        // Update Recognition record
        await db.revenueRecognition.update({
            where: { orderId },
            data: {
                netRevenue: { decrement: netRev },
                taxAmount: { decrement: taxRev || 0 },
                cogsAmount: { decrement: cogsRev },
                grossProfit: { decrement: netRev.minus(cogsRev) }
            }
        });

        // Refund points if partial or total? Usually total for full refund.
        if (order.userId && ratio.greaterThanOrEqualTo(0.99)) {
            await refundRedeemedPoints({ userId: order.userId, orderId });
        }
    },

    async _getDefaultWarehouseId(db: Prisma.TransactionClient | typeof prisma) {
        const w = await db.warehouse.findFirst({ where: { type: 'MAIN' } }) || await db.warehouse.findFirst();
        return w?.id;
    }
};
