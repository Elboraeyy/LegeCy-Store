'use server';

import prisma from '@/lib/prisma';

export interface DeadStockItem {
    variantId: string;
    productName: string;
    variantName: string;
    sku: string;
    quantity: number;
    costPrice: number;
    totalValue: number;
    lastSold?: Date;
    daysInactive: number;
}

export async function getDeadStockReport(days: number = 90): Promise<DeadStockItem[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);

    // 1. Get variants sold in the last X days
    const recentSales = await prisma.orderItem.findMany({
        where: { order: { createdAt: { gte: thresholdDate } } },
        select: { variantId: true },
        distinct: ['variantId']
    });
    const soldIds = new Set(recentSales.map(s => s.variantId).filter((id): id is string => id !== null));

    // 2. Get variants received in the last X days (excluding them from "Dead" status as they are "New")
    const recentReceipts = await prisma.inventoryLog.findMany({
        where: {
            createdAt: { gte: thresholdDate },
            // Assuming positive quantity actions imply receipt/stock-in
            quantity: { gt: 0 }
        },
        select: { variantId: true },
        distinct: ['variantId']
    });
    const receivedIds = new Set(recentReceipts.map(r => r.variantId));

    // 3. Get all inventory with stock > 0
    const inventory = await prisma.inventory.findMany({
        where: { available: { gt: 0 } },
        include: {
            variant: {
                include: { product: true }
            }
        }
    });

    const deadStock: DeadStockItem[] = [];

    for (const item of inventory) {
        if (!soldIds.has(item.variantId) && !receivedIds.has(item.variantId)) {
            // It's dead stock
            // Try to find the LAST sale date ever (to calculate exact days inactive)
            const lastSale = await prisma.order.findFirst({
                where: { items: { some: { variantId: item.variantId } } },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true }
            });

            // If no sale ever, check creation date
            const lastActivity = lastSale?.createdAt || item.variant.createdAt;
            const daysInactive = Math.floor((new Date().getTime() - lastActivity.getTime()) / (1000 * 3600 * 24));

            // Double check if daysInactive >= days (redundant likely, but safer)
            if (daysInactive >= days) {
                deadStock.push({
                    variantId: item.variantId,
                    productName: (item as any).variant.product.name,
                    variantName: (item.variant as any).name || 'Default',
                    sku: item.variant.sku || 'N/A',
                    quantity: item.available,
                    costPrice: Number(item.variant.costPrice || 0),
                    totalValue: Number(item.variant.costPrice || 0) * item.available,
                    lastSold: lastSale?.createdAt,
                    daysInactive
                });
            }
        }
    }

    return deadStock.sort((a, b) => b.totalValue - a.totalValue);
}
