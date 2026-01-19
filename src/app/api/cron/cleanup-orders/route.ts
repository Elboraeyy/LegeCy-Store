import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { internalCancelOrder } from '@/lib/services/orderService';
import { OrderStatus } from '@/lib/orderStatus';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // 1. Authorization
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // 2. Define Threshold (1 hour ago)
        const cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour

        // 3. Find Abandoned Orders
        const abandonedOrders = await prisma.order.findMany({
            where: {
                status: OrderStatus.PaymentPending, // or PENDING_PAYMENT depending on enum
                createdAt: {
                    lt: cutoffTime
                }
            },
            select: { id: true, createdAt: true }
        });

        if (abandonedOrders.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: 'No abandoned orders found' });
        }

        logger.info(`[CRON] Found ${abandonedOrders.length} abandoned orders to cancel.`);

        // 4. Cancel Orders (One by one to prevent total failure)
        const results = await Promise.allSettled(
            abandonedOrders.map(async (order) => {
                return prisma.$transaction(async (tx) => {
                    await internalCancelOrder(
                        tx,
                        order.id,
                        'System Auto-Cancellation: Payment Timeout'
                    );
                });
            })
        );

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failedCount = results.filter(r => r.status === 'rejected').length;

        if (failedCount > 0) {
            logger.error(`[CRON] Failed to cancel ${failedCount} orders during cleanup.`, {
                results: results.filter(r => r.status === 'rejected')
            });
        }

        return NextResponse.json({
            success: true,
            processed: abandonedOrders.length,
            cancelled: successCount,
            failed: failedCount
        });

    } catch (error) {
        logger.error('[CRON] Order Cleanup Failed', error as any);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
