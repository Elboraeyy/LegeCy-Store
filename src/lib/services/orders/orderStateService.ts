

import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { orderFinancialService } from './orderFinancialService';
import { orderNotificationService } from './orderNotificationService';
import { inventoryService } from '@/lib/services/inventoryService';
import { revenueService } from '@/lib/services/revenueService'; // For refunds/reversals
import { logger } from '@/lib/logger';
// Inline definition for build stability
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
     * Record event and trigger side effects
     */
    async recordOrderEvent(input: OrderEventInput) {
        const { orderId, eventType, fromStatus, toStatus, amount, reason, triggeredBy, metadata } = input;

        // 1. Audit Log
        const event = await prisma.orderEvent.create({
            data: {
                orderId, eventType, fromStatus, toStatus,
                amount: amount ? new Decimal(amount) : null,
                reason, triggeredBy,
                metadata: metadata as object | undefined,
            }
        });

        // 2. Orchestration
        try {
            switch (eventType) {
                case 'PAID':
                    await orderFinancialService.recordPaymentReceipt(orderId);
                    break;
                case 'SHIPPED':
                    await orderNotificationService.notifyShipped(orderId, metadata);
                    break;
                case 'DELIVERED':
                    await orderFinancialService.recognizeRevenue(orderId, triggeredBy);
                    await orderNotificationService.notifyDelivered(orderId);
                    break;
                case 'CANCELLED':
                    await this._handleCancellation(orderId, triggeredBy, reason);
                    break;
                case 'REFUNDED':
                    await this._handleRefund(orderId, amount || 0, triggeredBy, reason);
                    break;
            }
        } catch (error: any) {
            logger.error(`[OrderState] Failed to process ${eventType} for ${orderId}`, { error: error.message || error });
            // We log but don't throw, to avoid blocking the event recording? 
            // Ideally we should throw if it's critical. `recordPaymentReceipt` failure is bad.
            // Let's rethrow.
            throw error;
        }

        return event;
    },

    /**
     * Handle Cancellation
     */
    async _handleCancellation(orderId: string, triggeredBy?: string, reason?: string) {
        await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true, revenueRecognition: true }
            });
            if (!order) return;

            // 1. Reverse Financials
            if (order.revenueRecognition) {
                await revenueService.reverseRevenue(orderId, reason || 'Order cancelled');
                await tx.revenueRecognition.delete({ where: { orderId } });
            }

            // 2. Release Stock (Multi-Warehouse Aware + Legacy Fallback)
            let legacyWarehouseId: string | null = null;

            for (const item of order.items) {
                if (item.variantId) {
                    let targetWarehouseId = (item as any).warehouseId;

                    // Fallback for old orders (Pre-Audit)
                    if (!targetWarehouseId) {
                        if (!legacyWarehouseId) {
                            const w = await tx.warehouse.findFirst({ where: { type: 'MAIN' } })
                                || await tx.warehouse.findFirst();
                            legacyWarehouseId = w?.id || null;
                        }
                        targetWarehouseId = legacyWarehouseId;
                    }

                    if (targetWarehouseId) {
                        await inventoryService.releaseStock(tx, targetWarehouseId, item.variantId, item.quantity);

                        // Log (Manual log here as releaseStock only updates)
                        await tx.inventoryLog.create({
                            data: {
                                warehouseId: targetWarehouseId,
                                variantId: item.variantId,
                                action: 'ADJUSTMENT', // Should use 'RETURN' or 'CANCEL' if enum allows
                                quantity: item.quantity,
                                reason: `Order cancelled: ${reason}`,
                                referenceId: orderId,
                                adminId: triggeredBy
                            }
                        });
                    } else {
                        logger.error(`[OrderState] Failed to release stock for item ${item.id} - No warehouse found`);
                    }
                }
            }
        });
        logger.info(`[OrderState] Cancelled ${orderId}`);
    },

    /**
     * Handle Refund
     */
    async _handleRefund(orderId: string, amount: number, triggeredBy?: string, reason?: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { revenueRecognition: true }
        });
        if (!order) return;

        const orderTotal = new Decimal(order.totalPrice);
        const refundAmount = new Decimal(amount);
        const ratio = orderTotal.gt(0) ? refundAmount.div(orderTotal) : new Decimal(0);

        if (order.revenueRecognition) {
            const rec = order.revenueRecognition;
            const taxTotal = rec.taxAmount ? new Decimal(rec.taxAmount) : new Decimal(0);
            const netTotal = new Decimal(rec.netRevenue);
            const cogsTotal = new Decimal(rec.cogsAmount);

            // Calculate proportional reversal
            const taxRev = taxTotal.mul(ratio);
            const netRev = netTotal.mul(ratio);
            const cogsRev = cogsTotal.mul(ratio);

            // Calls revenueService for Journal Logic (Now supports Decimal)
            await revenueService.createRefundEntry(orderId, netRev, cogsRev, reason, taxRev);

            // Update Record
            await prisma.revenueRecognition.update({
                where: { orderId },
                data: {
                    netRevenue: { decrement: netRev },
                    taxAmount: { decrement: taxRev },
                    cogsAmount: { decrement: cogsRev },
                    grossProfit: { decrement: netRev.minus(cogsRev) }
                }
            });
        }
        logger.info(`[OrderState] Refunded ${orderId}: ${amount}`);
    }
};
