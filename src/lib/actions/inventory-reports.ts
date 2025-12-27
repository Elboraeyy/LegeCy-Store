'use server';

import prismaClient from '@/lib/prisma';
import { validateAdminSession } from '@/lib/auth/session';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = prismaClient!;

// --- Types ---

export type InventoryValuation = {
    totalSKUs: number;
    totalUnits: number;
    totalValue: number;
    averageValue: number;
    byWarehouse: {
        warehouseId: string;
        warehouseName: string;
        skuCount: number;
        units: number;
        value: number;
    }[];
};

export type StockMovementSummary = {
    period: string;
    adjustments: number;
    transfersIn: number;
    transfersOut: number;
    orderFulfillments: number;
    returns: number;
    netChange: number;
};

export type LowStockItem = {
    variantId: string;
    sku: string;
    productName: string;
    warehouseId: string;
    warehouseName: string;
    available: number;
    minStock: number;
    percentage: number;
};

export type WarehouseComparison = {
    warehouseId: string;
    warehouseName: string;
    totalSKUs: number;
    totalUnits: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    utilizationScore: number;
};

// --- Actions ---

export async function getInventoryValuation(): Promise<InventoryValuation> {
    try {
        await validateAdminSession();

        const warehouses = await prisma.warehouse.findMany({
            where: { isActive: true },
            include: {
                inventory: {
                    include: {
                        variant: { select: { price: true } }
                    }
                }
            }
        });

        const byWarehouse = warehouses.map(wh => {
            const units = wh.inventory.reduce((sum, inv) => sum + inv.available, 0);
            const value = wh.inventory.reduce((sum, inv) => {
                const price = inv.variant.price instanceof Decimal 
                    ? inv.variant.price.toNumber() 
                    : Number(inv.variant.price);
                return sum + (inv.available * price);
            }, 0);

            return {
                warehouseId: wh.id,
                warehouseName: wh.name,
                skuCount: wh.inventory.length,
                units,
                value
            };
        });

        const totalSKUs = byWarehouse.reduce((sum, w) => sum + w.skuCount, 0);
        const totalUnits = byWarehouse.reduce((sum, w) => sum + w.units, 0);
        const totalValue = byWarehouse.reduce((sum, w) => sum + w.value, 0);

        return {
            totalSKUs,
            totalUnits,
            totalValue,
            averageValue: totalUnits > 0 ? totalValue / totalUnits : 0,
            byWarehouse
        };
    } catch (error) {
        console.error('Failed to get inventory valuation:', error);
        return { totalSKUs: 0, totalUnits: 0, totalValue: 0, averageValue: 0, byWarehouse: [] };
    }
}

export async function getStockMovementReport(days: number = 30): Promise<StockMovementSummary[]> {
    try {
        await validateAdminSession();

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const logs = await prisma.inventoryLog.findMany({
            where: { createdAt: { gte: startDate } },
            select: { action: true, quantity: true, createdAt: true }
        });

        // Group by day
        const dailyMap = new Map<string, StockMovementSummary>();

        for (const log of logs) {
            const dateKey = log.createdAt.toISOString().split('T')[0];
            
            if (!dailyMap.has(dateKey)) {
                dailyMap.set(dateKey, {
                    period: dateKey,
                    adjustments: 0,
                    transfersIn: 0,
                    transfersOut: 0,
                    orderFulfillments: 0,
                    returns: 0,
                    netChange: 0
                });
            }

            const day = dailyMap.get(dateKey)!;
            
            switch (log.action) {
                case 'ADJUST':
                    day.adjustments += log.quantity;
                    break;
                case 'TRANSFER_IN':
                    day.transfersIn += log.quantity;
                    break;
                case 'TRANSFER_OUT':
                    day.transfersOut += Math.abs(log.quantity);
                    break;
                case 'ORDER_FULFILL':
                    day.orderFulfillments += Math.abs(log.quantity);
                    break;
                case 'RETURN':
                    day.returns += log.quantity;
                    break;
            }
            
            day.netChange += log.quantity;
        }

        // Sort by date and return last N days
        return Array.from(dailyMap.values())
            .sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
        console.error('Failed to get stock movement report:', error);
        return [];
    }
}

export async function getLowStockReport(): Promise<LowStockItem[]> {
    try {
        await validateAdminSession();

        const lowStock = await prisma.inventory.findMany({
            where: {
                available: { lte: prisma.inventory.fields.minStock },
                warehouse: { isActive: true }
            },
            include: {
                warehouse: { select: { name: true } },
                variant: {
                    include: {
                        product: { select: { name: true } }
                    }
                }
            },
            orderBy: { available: 'asc' },
            take: 50
        });

        return lowStock.map(inv => ({
            variantId: inv.variantId,
            sku: inv.variant.sku,
            productName: inv.variant.product.name,
            warehouseId: inv.warehouseId,
            warehouseName: inv.warehouse.name,
            available: inv.available,
            minStock: inv.minStock,
            percentage: inv.minStock > 0 ? Math.round((inv.available / inv.minStock) * 100) : 0
        }));
    } catch (error) {
        console.error('Failed to get low stock report:', error);
        return [];
    }
}

export async function getWarehouseComparison(): Promise<WarehouseComparison[]> {
    try {
        await validateAdminSession();

        const warehouses = await prisma.warehouse.findMany({
            where: { isActive: true },
            include: {
                inventory: {
                    include: {
                        variant: { select: { price: true } }
                    }
                }
            }
        });

        return warehouses.map(wh => {
            const totalUnits = wh.inventory.reduce((sum, inv) => sum + inv.available, 0);
            const totalValue = wh.inventory.reduce((sum, inv) => {
                const price = inv.variant.price instanceof Decimal 
                    ? inv.variant.price.toNumber() 
                    : Number(inv.variant.price);
                return sum + (inv.available * price);
            }, 0);
            const lowStockCount = wh.inventory.filter(inv => inv.available > 0 && inv.available <= inv.minStock).length;
            const outOfStockCount = wh.inventory.filter(inv => inv.available === 0).length;
            
            // Utilization score: higher = better (based on stock health)
            const totalItems = wh.inventory.length;
            const healthyItems = totalItems - lowStockCount - outOfStockCount;
            const utilizationScore = totalItems > 0 ? Math.round((healthyItems / totalItems) * 100) : 100;

            return {
                warehouseId: wh.id,
                warehouseName: wh.name,
                totalSKUs: wh.inventory.length,
                totalUnits,
                totalValue,
                lowStockCount,
                outOfStockCount,
                utilizationScore
            };
        });
    } catch (error) {
        console.error('Failed to get warehouse comparison:', error);
        return [];
    }
}

export async function getActivitySummary(): Promise<{
    recentAdjustments: number;
    pendingTransfers: number;
    activeAlerts: number;
    activeCounts: number;
}> {
    try {
        await validateAdminSession();

        const last24h = new Date();
        last24h.setHours(last24h.getHours() - 24);

        const [recentAdjustments, pendingTransfers, activeAlerts, activeCounts] = await prisma.$transaction([
            prisma.inventoryLog.count({ where: { createdAt: { gte: last24h } } }),
            prisma.stockTransfer.count({ where: { status: { in: ['PENDING', 'APPROVED', 'IN_TRANSIT'] } } }),
            prisma.stockAlert.count({ where: { status: { in: ['NEW', 'ACKNOWLEDGED'] } } }),
            prisma.inventoryCount.count({ where: { status: { in: ['DRAFT', 'IN_PROGRESS'] } } })
        ]);

        return { recentAdjustments, pendingTransfers, activeAlerts, activeCounts };
    } catch (error) {
        console.error('Failed to get activity summary:', error);
        return { recentAdjustments: 0, pendingTransfers: 0, activeAlerts: 0, activeCounts: 0 };
    }
}
