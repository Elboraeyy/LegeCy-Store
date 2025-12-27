'use server';

import prismaClient from '@/lib/prisma';
import { validateAdminSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

const prisma = prismaClient!;

// --- Types ---

export type AlertWithDetails = {
    id: string;
    warehouseId: string;
    warehouseName: string;
    variantId: string;
    sku: string;
    productName: string;
    productImage: string | null;
    alertType: string;
    threshold: number;
    currentStock: number;
    status: string;
    createdAt: Date;
    resolvedAt: Date | null;
    resolvedByName: string | null;
    resolvedNote: string | null;
};

// --- Actions ---

export async function fetchAlerts(params?: { 
    status?: string; 
    alertType?: string;
    warehouseId?: string;
    page?: number;
    limit?: number;
}): Promise<{ data: AlertWithDetails[]; meta: { total: number; page: number; totalPages: number } }> {
    try {
        await validateAdminSession();
        
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (params?.status && params.status !== 'ALL') {
            where.status = params.status;
        }
        if (params?.alertType && params.alertType !== 'ALL') {
            where.alertType = params.alertType;
        }
        if (params?.warehouseId) {
            where.warehouseId = params.warehouseId;
        }

        const [alerts, total] = await prisma.$transaction([
            prisma.stockAlert.findMany({
                where,
                include: {
                    warehouse: { select: { name: true } },
                    variant: {
                        include: {
                            product: { select: { name: true, imageUrl: true } }
                        }
                    },
                    resolvedBy: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.stockAlert.count({ where })
        ]);

        const data: AlertWithDetails[] = alerts.map(a => ({
            id: a.id,
            warehouseId: a.warehouseId,
            warehouseName: a.warehouse.name,
            variantId: a.variantId,
            sku: a.variant.sku,
            productName: a.variant.product.name,
            productImage: a.variant.product.imageUrl,
            alertType: a.alertType,
            threshold: a.threshold,
            currentStock: a.currentStock,
            status: a.status,
            createdAt: a.createdAt,
            resolvedAt: a.resolvedAt,
            resolvedByName: a.resolvedBy?.name || null,
            resolvedNote: a.resolvedNote
        }));

        return {
            data,
            meta: { total, page, totalPages: Math.ceil(total / limit) }
        };
    } catch (error) {
        console.error('Failed to fetch alerts:', error);
        return { data: [], meta: { total: 0, page: 1, totalPages: 1 } };
    }
}

export async function getAlertCounts(): Promise<{ new: number; acknowledged: number; total: number }> {
    try {
        await validateAdminSession();
        
        const [newCount, acknowledgedCount] = await prisma.$transaction([
            prisma.stockAlert.count({ where: { status: 'NEW' } }),
            prisma.stockAlert.count({ where: { status: 'ACKNOWLEDGED' } })
        ]);

        return {
            new: newCount,
            acknowledged: acknowledgedCount,
            total: newCount + acknowledgedCount
        };
    } catch (error) {
        console.error('Failed to get alert counts:', error);
        return { new: 0, acknowledged: 0, total: 0 };
    }
}

export async function acknowledgeAlert(id: string) {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        await prisma.stockAlert.update({
            where: { id },
            data: { status: 'ACKNOWLEDGED' }
        });

        revalidatePath('/admin/inventory/alerts');
        
        return { success: true };
    } catch (error) {
        console.error('Failed to acknowledge alert:', error);
        return { error: 'Failed to acknowledge alert' };
    }
}

export async function resolveAlert(id: string, note?: string) {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        await prisma.stockAlert.update({
            where: { id },
            data: { 
                status: 'RESOLVED',
                resolvedById: session.user.id,
                resolvedAt: new Date(),
                resolvedNote: note || null
            }
        });

        revalidatePath('/admin/inventory/alerts');
        
        return { success: true };
    } catch (error) {
        console.error('Failed to resolve alert:', error);
        return { error: 'Failed to resolve alert' };
    }
}

export async function bulkAcknowledgeAlerts(ids: string[]) {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        await prisma.stockAlert.updateMany({
            where: { id: { in: ids } },
            data: { status: 'ACKNOWLEDGED' }
        });

        revalidatePath('/admin/inventory/alerts');
        
        return { success: true, count: ids.length };
    } catch (error) {
        console.error('Failed to bulk acknowledge:', error);
        return { error: 'Failed to acknowledge alerts' };
    }
}

export async function bulkResolveAlerts(ids: string[]) {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        await prisma.stockAlert.updateMany({
            where: { id: { in: ids } },
            data: { 
                status: 'RESOLVED',
                resolvedById: session.user.id,
                resolvedAt: new Date()
            }
        });

        revalidatePath('/admin/inventory/alerts');
        
        return { success: true, count: ids.length };
    } catch (error) {
        console.error('Failed to bulk resolve:', error);
        return { error: 'Failed to resolve alerts' };
    }
}

// Auto-generate alerts based on current stock levels
export async function generateStockAlerts() {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        // Find all inventory items below threshold
        const lowStockItems = await prisma.inventory.findMany({
            where: {
                available: { lte: prisma.inventory.fields.minStock }
            },
            include: {
                warehouse: true,
                variant: true
            }
        });

        let created = 0;

        for (const inv of lowStockItems) {
            // Check if alert already exists for this item
            const existingAlert = await prisma.stockAlert.findFirst({
                where: {
                    warehouseId: inv.warehouseId,
                    variantId: inv.variantId,
                    status: { in: ['NEW', 'ACKNOWLEDGED'] }
                }
            });

            if (!existingAlert) {
                const alertType = inv.available === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK';
                
                await prisma.stockAlert.create({
                    data: {
                        warehouseId: inv.warehouseId,
                        variantId: inv.variantId,
                        alertType,
                        threshold: inv.minStock,
                        currentStock: inv.available,
                        status: 'NEW'
                    }
                });
                created++;
            }
        }

        revalidatePath('/admin/inventory/alerts');
        
        return { success: true, created };
    } catch (error) {
        console.error('Failed to generate alerts:', error);
        return { error: 'Failed to generate alerts' };
    }
}
