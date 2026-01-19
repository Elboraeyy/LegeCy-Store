import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendAbandonedCartEmail } from '@/lib/services/emailService';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Authenticate Cron Request (Simple Secret Check)
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 1. Find Abandoned Carts
        // Criteria: PENDING_PAYMENT, Created > 2 hours ago, Created < 24 hours ago, Recovery Not Sent
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const abandonedOrders = await prisma.order.findMany({
            where: {
                status: 'PENDING_PAYMENT',
                createdAt: {
                    lt: twoHoursAgo,
                    gt: twentyFourHoursAgo
                },
                recoveryEmailSent: false
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            },
            take: 20 // Batch limit
        });

        logger.info(`[AbandonedRecovery] Found ${abandonedOrders.length} potential abandoned carts.`);

        let sentCount = 0;

        for (const order of abandonedOrders) {
            // Validate email
            if (!order.customerEmail || !order.customerEmail.includes('@')) continue;

            // Prepare Data
            /* eslint-disable @typescript-eslint/no-explicit-any */
            const items = (order as any).items.map((i: any) => ({
                name: i.product.name,
                price: Number(i.price),
                image: i.product.images[0]
            }));
            /* eslint-enable @typescript-eslint/no-explicit-any */

            const cartUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout?orderId=${order.id}`; // Or restore cart link

            // Send Email
            const emailResult = await sendAbandonedCartEmail({
                customerName: order.customerName || 'Valued Customer',
                customerEmail: order.customerEmail,
                items,
                cartUrl,
                totalValue: Number(order.totalPrice)
            });

            if (emailResult.success) {
                // Mark as sent
                await prisma.order.update({
                    where: { id: order.id },
                    data: { recoveryEmailSent: true }
                });
                sentCount++;
            }
        }

        return NextResponse.json({
            success: true,
            processed: abandonedOrders.length,
            sent: sentCount
        });

    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('[AbandonedRecovery] Failed', { error: err.message });
        return new NextResponse(`Error: ${err.message}`, { status: 500 });
    }
}
