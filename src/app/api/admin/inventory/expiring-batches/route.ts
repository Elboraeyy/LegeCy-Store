import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const now = new Date();

        // Calculate date thresholds
        const days30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const days60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
        const days90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

        // Get counts for each threshold
        const [expiring30Days, expiring60Days, expiring90Days] = await Promise.all([
            prisma.inventoryBatch.count({
                where: {
                    expiryDate: { lte: days30, gte: now },
                    remainingQuantity: { gt: 0 }
                }
            }),
            prisma.inventoryBatch.count({
                where: {
                    expiryDate: { lte: days60, gt: days30 },
                    remainingQuantity: { gt: 0 }
                }
            }),
            prisma.inventoryBatch.count({
                where: {
                    expiryDate: { lte: days90, gt: days60 },
                    remainingQuantity: { gt: 0 }
                }
            })
        ]);

        // Get items expiring soon with details
        const expiringItems = await prisma.inventoryBatch.findMany({
            where: {
                expiryDate: { lte: days90, gte: now },
                remainingQuantity: { gt: 0 }
            },
            orderBy: { expiryDate: 'asc' },
            take: 10,
            include: {
                variant: {
                    include: {
                        product: { select: { name: true } }
                    }
                }
            }
        });

        // Calculate value at risk (using cost price from batches)
        const valueAtRisk = expiringItems.reduce((sum, batch) => {
            const cost = batch.unitCost ? Number(batch.unitCost) : 0;
            return sum + (cost * batch.remainingQuantity);
        }, 0);

        const items = expiringItems.map(batch => ({
            productName: batch.variant?.product?.name || 'Unknown',
            sku: batch.variant?.sku || 'N/A',
            quantity: batch.remainingQuantity,
            expiryDate: batch.expiryDate?.toISOString() || '',
            daysLeft: batch.expiryDate
                ? Math.max(0, Math.ceil((batch.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                : 0
        }));

        return NextResponse.json({
            expiring30Days,
            expiring60Days,
            expiring90Days,
            totalValueAtRisk: valueAtRisk,
            items
        });
    } catch (error) {
        logger.error('Failed to fetch expiring batches', { error });
        return NextResponse.json(
            { error: 'Failed to fetch expiring batches' },
            { status: 500 }
        );
    }
}
