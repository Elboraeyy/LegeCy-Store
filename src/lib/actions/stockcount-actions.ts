'use server';

import prismaClient from '@/lib/prisma';
import { validateAdminSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

const prisma = prismaClient!;

// --- Types ---

export type StockCountWithDetails = {
    id: string;
    countNumber: string;
    warehouseId: string;
    warehouseName: string;
    status: string;
    createdById: string | null;
    createdByName: string | null;
    completedById: string | null;
    completedByName: string | null;
    countDate: Date;
    notes: string | null;
    createdAt: Date;
    completedAt: Date | null;
    itemCount: number;
    countedItems: number;
    variance: number;
};

export type StockCountItemWithDetails = {
    id: string;
    variantId: string;
    sku: string;
    productName: string;
    productImage: string | null;
    systemQty: number;
    countedQty: number | null;
    variance: number | null;
    notes: string | null;
    countedAt: Date | null;
};

// --- Actions ---

export async function fetchStockCounts(params?: { 
    status?: string; 
    warehouseId?: string;
    page?: number;
    limit?: number;
}): Promise<{ data: StockCountWithDetails[]; meta: { total: number; page: number; totalPages: number } }> {
    try {
        await validateAdminSession();
        
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (params?.status && params.status !== 'ALL') {
            where.status = params.status;
        }
        if (params?.warehouseId) {
            where.warehouseId = params.warehouseId;
        }

        const [counts, total] = await prisma.$transaction([
            prisma.inventoryCount.findMany({
                where,
                include: {
                    warehouse: { select: { name: true } },
                    createdBy: { select: { name: true } },
                    completedBy: { select: { name: true } },
                    items: { select: { countedQty: true, variance: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.inventoryCount.count({ where })
        ]);

        const data: StockCountWithDetails[] = counts.map(c => ({
            id: c.id,
            countNumber: c.countNumber,
            warehouseId: c.warehouseId,
            warehouseName: c.warehouse.name,
            status: c.status,
            createdById: c.createdById,
            createdByName: c.createdBy?.name || null,
            completedById: c.completedById,
            completedByName: c.completedBy?.name || null,
            countDate: c.countDate,
            notes: c.notes,
            createdAt: c.createdAt,
            completedAt: c.completedAt,
            itemCount: c.items.length,
            countedItems: c.items.filter(i => i.countedQty !== null).length,
            variance: c.items.reduce((sum, i) => sum + (i.variance || 0), 0)
        }));

        return {
            data,
            meta: { total, page, totalPages: Math.ceil(total / limit) }
        };
    } catch (error) {
        console.error('Failed to fetch stock counts:', error);
        return { data: [], meta: { total: 0, page: 1, totalPages: 1 } };
    }
}

export async function fetchStockCountById(id: string): Promise<{ count: StockCountWithDetails; items: StockCountItemWithDetails[] } | null> {
    try {
        await validateAdminSession();
        
        const c = await prisma.inventoryCount.findUnique({
            where: { id },
            include: {
                warehouse: { select: { name: true } },
                createdBy: { select: { name: true } },
                completedBy: { select: { name: true } },
                items: {
                    include: {
                        variant: {
                            include: {
                                product: { select: { name: true, imageUrl: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!c) return null;

        const count: StockCountWithDetails = {
            id: c.id,
            countNumber: c.countNumber,
            warehouseId: c.warehouseId,
            warehouseName: c.warehouse.name,
            status: c.status,
            createdById: c.createdById,
            createdByName: c.createdBy?.name || null,
            completedById: c.completedById,
            completedByName: c.completedBy?.name || null,
            countDate: c.countDate,
            notes: c.notes,
            createdAt: c.createdAt,
            completedAt: c.completedAt,
            itemCount: c.items.length,
            countedItems: c.items.filter(i => i.countedQty !== null).length,
            variance: c.items.reduce((sum, i) => sum + (i.variance || 0), 0)
        };

        const items: StockCountItemWithDetails[] = c.items.map(i => ({
            id: i.id,
            variantId: i.variantId,
            sku: i.variant.sku,
            productName: i.variant.product.name,
            productImage: i.variant.product.imageUrl,
            systemQty: i.systemQty,
            countedQty: i.countedQty,
            variance: i.variance,
            notes: i.notes,
            countedAt: i.countedAt
        }));

        return { count, items };
    } catch (error) {
        console.error('Failed to fetch stock count:', error);
        return null;
    }
}

export async function createStockCount(warehouseId: string, notes?: string) {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        // Check for existing in-progress count
        const existing = await prisma.inventoryCount.findFirst({
            where: { 
                warehouseId, 
                status: { in: ['DRAFT', 'IN_PROGRESS'] } 
            }
        });

        if (existing) {
            return { error: 'There is already an active count for this warehouse' };
        }

        // Get all inventory items for this warehouse
        const inventoryItems = await prisma.inventory.findMany({
            where: { warehouseId },
            select: { variantId: true, available: true }
        });

        if (inventoryItems.length === 0) {
            return { error: 'No inventory items in this warehouse to count' };
        }

        // Generate count number
        const countNum = await prisma.inventoryCount.count();
        const countNumber = `CNT-${String(countNum + 1).padStart(6, '0')}`;

        const stockCount = await prisma.inventoryCount.create({
            data: {
                countNumber,
                warehouseId,
                status: 'DRAFT',
                createdById: session.user.id,
                notes: notes || null,
                items: {
                    create: inventoryItems.map(inv => ({
                        variantId: inv.variantId,
                        systemQty: inv.available
                    }))
                }
            }
        });

        revalidatePath('/admin/inventory/counts');
        
        return { success: true, count: stockCount };
    } catch (error) {
        console.error('Failed to create stock count:', error);
        return { error: 'Failed to create stock count' };
    }
}

export async function startStockCount(id: string) {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        await prisma.inventoryCount.update({
            where: { id },
            data: { status: 'IN_PROGRESS' }
        });

        revalidatePath('/admin/inventory/counts');
        
        return { success: true };
    } catch (error) {
        console.error('Failed to start stock count:', error);
        return { error: 'Failed to start stock count' };
    }
}

export async function updateCountItem(itemId: string, countedQty: number, notes?: string) {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        const item = await prisma.inventoryCountItem.findUnique({ where: { id: itemId } });
        if (!item) return { error: 'Item not found' };

        const variance = countedQty - item.systemQty;

        await prisma.inventoryCountItem.update({
            where: { id: itemId },
            data: {
                countedQty,
                variance,
                notes: notes || null,
                countedAt: new Date()
            }
        });

        revalidatePath('/admin/inventory/counts');
        
        return { success: true, variance };
    } catch (error) {
        console.error('Failed to update count item:', error);
        return { error: 'Failed to update count item' };
    }
}

export async function completeStockCount(id: string, applyAdjustments: boolean) {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        const count = await prisma.inventoryCount.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!count) return { error: 'Count not found' };
        if (count.status === 'COMPLETED') return { error: 'Count already completed' };

        // Check all items are counted
        const uncounted = count.items.filter(i => i.countedQty === null);
        if (uncounted.length > 0) {
            return { error: `${uncounted.length} items have not been counted yet` };
        }

        // Apply inventory adjustments if requested
        if (applyAdjustments) {
            for (const item of count.items) {
                if (item.variance && item.variance !== 0) {
                    const inv = await prisma.inventory.findUnique({
                        where: {
                            warehouseId_variantId: {
                                warehouseId: count.warehouseId,
                                variantId: item.variantId
                            }
                        }
                    });

                    if (inv) {
                        const newQty = item.countedQty!;
                        
                        await prisma.inventory.update({
                            where: { id: inv.id },
                            data: { available: newQty }
                        });

                        await prisma.inventoryLog.create({
                            data: {
                                warehouseId: count.warehouseId,
                                variantId: item.variantId,
                                action: 'ADJUST',
                                quantity: item.variance,
                                balanceAfter: newQty,
                                reason: `Stock count adjustment (${count.countNumber})`,
                                referenceId: count.id,
                                adminId: session.user.id
                            }
                        });
                    }
                }
            }
        }

        await prisma.inventoryCount.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                completedById: session.user.id,
                completedAt: new Date()
            }
        });

        revalidatePath('/admin/inventory/counts');
        revalidatePath('/admin/inventory');
        
        return { success: true };
    } catch (error) {
        console.error('Failed to complete stock count:', error);
        return { error: 'Failed to complete stock count' };
    }
}

export async function cancelStockCount(id: string) {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        await prisma.inventoryCount.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });

        revalidatePath('/admin/inventory/counts');
        
        return { success: true };
    } catch (error) {
        console.error('Failed to cancel stock count:', error);
        return { error: 'Failed to cancel stock count' };
    }
}
