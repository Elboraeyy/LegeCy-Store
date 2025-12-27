'use server';

import prismaClient from '@/lib/prisma';
import { validateAdminSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

const prisma = prismaClient!;

// --- Types ---

export type TransferWithDetails = {
    id: string;
    transferNumber: string;
    fromWarehouseId: string;
    fromWarehouseName: string;
    toWarehouseId: string;
    toWarehouseName: string;
    status: string;
    notes: string | null;
    createdById: string | null;
    createdByName: string | null;
    approvedById: string | null;
    approvedByName: string | null;
    createdAt: Date;
    approvedAt: Date | null;
    shippedAt: Date | null;
    receivedAt: Date | null;
    cancelledAt: Date | null;
    cancelReason: string | null;
    itemCount: number;
    totalQuantity: number;
};

export type TransferItemWithDetails = {
    id: string;
    variantId: string;
    sku: string;
    productName: string;
    productImage: string | null;
    requestedQty: number;
    sentQty: number | null;
    receivedQty: number | null;
    notes: string | null;
};

export type CreateTransferData = {
    fromWarehouseId: string;
    toWarehouseId: string;
    notes?: string;
    items: { variantId: string; quantity: number }[];
};

// --- Actions ---

export async function fetchTransfers(params?: { 
    status?: string; 
    warehouseId?: string;
    page?: number;
    limit?: number;
}): Promise<{ data: TransferWithDetails[]; meta: { total: number; page: number; totalPages: number } }> {
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
            where.OR = [
                { fromWarehouseId: params.warehouseId },
                { toWarehouseId: params.warehouseId }
            ];
        }

        const [transfers, total] = await prisma.$transaction([
            prisma.stockTransfer.findMany({
                where,
                include: {
                    fromWarehouse: { select: { name: true } },
                    toWarehouse: { select: { name: true } },
                    createdBy: { select: { name: true } },
                    approvedBy: { select: { name: true } },
                    items: { select: { requestedQty: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.stockTransfer.count({ where })
        ]);

        const data: TransferWithDetails[] = transfers.map(t => ({
            id: t.id,
            transferNumber: t.transferNumber,
            fromWarehouseId: t.fromWarehouseId,
            fromWarehouseName: t.fromWarehouse.name,
            toWarehouseId: t.toWarehouseId,
            toWarehouseName: t.toWarehouse.name,
            status: t.status,
            notes: t.notes,
            createdById: t.createdById,
            createdByName: t.createdBy?.name || null,
            approvedById: t.approvedById,
            approvedByName: t.approvedBy?.name || null,
            createdAt: t.createdAt,
            approvedAt: t.approvedAt,
            shippedAt: t.shippedAt,
            receivedAt: t.receivedAt,
            cancelledAt: t.cancelledAt,
            cancelReason: t.cancelReason,
            itemCount: t.items.length,
            totalQuantity: t.items.reduce((sum, i) => sum + i.requestedQty, 0)
        }));

        return {
            data,
            meta: { total, page, totalPages: Math.ceil(total / limit) }
        };
    } catch (error) {
        console.error('Failed to fetch transfers:', error);
        return { data: [], meta: { total: 0, page: 1, totalPages: 1 } };
    }
}

export async function fetchTransferById(id: string): Promise<{ transfer: TransferWithDetails; items: TransferItemWithDetails[] } | null> {
    try {
        await validateAdminSession();
        
        const t = await prisma.stockTransfer.findUnique({
            where: { id },
            include: {
                fromWarehouse: { select: { name: true } },
                toWarehouse: { select: { name: true } },
                createdBy: { select: { name: true } },
                approvedBy: { select: { name: true } },
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

        if (!t) return null;

        const transfer: TransferWithDetails = {
            id: t.id,
            transferNumber: t.transferNumber,
            fromWarehouseId: t.fromWarehouseId,
            fromWarehouseName: t.fromWarehouse.name,
            toWarehouseId: t.toWarehouseId,
            toWarehouseName: t.toWarehouse.name,
            status: t.status,
            notes: t.notes,
            createdById: t.createdById,
            createdByName: t.createdBy?.name || null,
            approvedById: t.approvedById,
            approvedByName: t.approvedBy?.name || null,
            createdAt: t.createdAt,
            approvedAt: t.approvedAt,
            shippedAt: t.shippedAt,
            receivedAt: t.receivedAt,
            cancelledAt: t.cancelledAt,
            cancelReason: t.cancelReason,
            itemCount: t.items.length,
            totalQuantity: t.items.reduce((sum, i) => sum + i.requestedQty, 0)
        };

        const items: TransferItemWithDetails[] = t.items.map(i => ({
            id: i.id,
            variantId: i.variantId,
            sku: i.variant.sku,
            productName: i.variant.product.name,
            productImage: i.variant.product.imageUrl,
            requestedQty: i.requestedQty,
            sentQty: i.sentQty,
            receivedQty: i.receivedQty,
            notes: i.notes
        }));

        return { transfer, items };
    } catch (error) {
        console.error('Failed to fetch transfer:', error);
        return null;
    }
}

export async function createTransfer(data: CreateTransferData) {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        if (data.fromWarehouseId === data.toWarehouseId) {
            return { error: 'Source and destination warehouse must be different' };
        }

        if (data.items.length === 0) {
            return { error: 'Transfer must have at least one item' };
        }

        // Validate stock availability
        for (const item of data.items) {
            const inventory = await prisma.inventory.findUnique({
                where: {
                    warehouseId_variantId: {
                        warehouseId: data.fromWarehouseId,
                        variantId: item.variantId
                    }
                }
            });

            if (!inventory || inventory.available < item.quantity) {
                return { error: `Insufficient stock for item ${item.variantId}` };
            }
        }

        // Generate transfer number
        const count = await prisma.stockTransfer.count();
        const transferNumber = `TRF-${String(count + 1).padStart(6, '0')}`;

        const transfer = await prisma.stockTransfer.create({
            data: {
                transferNumber,
                fromWarehouseId: data.fromWarehouseId,
                toWarehouseId: data.toWarehouseId,
                status: 'PENDING',
                notes: data.notes || null,
                createdById: session.user.id,
                items: {
                    create: data.items.map(i => ({
                        variantId: i.variantId,
                        requestedQty: i.quantity
                    }))
                }
            }
        });

        revalidatePath('/admin/inventory/transfers');
        
        return { success: true, transfer };
    } catch (error) {
        console.error('Failed to create transfer:', error);
        return { error: 'Failed to create transfer' };
    }
}

export async function approveTransfer(id: string) {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        const transfer = await prisma.stockTransfer.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!transfer) return { error: 'Transfer not found' };
        if (transfer.status !== 'PENDING') return { error: 'Transfer is not pending' };

        // Reserve stock from source warehouse
        for (const item of transfer.items) {
            await prisma.inventory.update({
                where: {
                    warehouseId_variantId: {
                        warehouseId: transfer.fromWarehouseId,
                        variantId: item.variantId
                    }
                },
                data: {
                    available: { decrement: item.requestedQty },
                    reserved: { increment: item.requestedQty }
                }
            });
        }

        await prisma.stockTransfer.update({
            where: { id },
            data: {
                status: 'APPROVED',
                approvedById: session.user.id,
                approvedAt: new Date()
            }
        });

        revalidatePath('/admin/inventory/transfers');
        
        return { success: true };
    } catch (error) {
        console.error('Failed to approve transfer:', error);
        return { error: 'Failed to approve transfer' };
    }
}

export async function shipTransfer(id: string, sentQuantities?: { itemId: string; sentQty: number }[]) {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        const transfer = await prisma.stockTransfer.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!transfer) return { error: 'Transfer not found' };
        if (transfer.status !== 'APPROVED') return { error: 'Transfer must be approved first' };

        // Update sent quantities if provided
        if (sentQuantities) {
            for (const sq of sentQuantities) {
                await prisma.stockTransferItem.update({
                    where: { id: sq.itemId },
                    data: { sentQty: sq.sentQty }
                });
            }
        } else {
            // Default: sent = requested
            for (const item of transfer.items) {
                await prisma.stockTransferItem.update({
                    where: { id: item.id },
                    data: { sentQty: item.requestedQty }
                });
            }
        }

        // Deduct from reserved, create OUT logs
        for (const item of transfer.items) {
            const qty = sentQuantities?.find(sq => sq.itemId === item.id)?.sentQty || item.requestedQty;
            
            const inventory = await prisma.inventory.update({
                where: {
                    warehouseId_variantId: {
                        warehouseId: transfer.fromWarehouseId,
                        variantId: item.variantId
                    }
                },
                data: {
                    reserved: { decrement: qty }
                }
            });

            await prisma.inventoryLog.create({
                data: {
                    warehouseId: transfer.fromWarehouseId,
                    variantId: item.variantId,
                    action: 'TRANSFER_OUT',
                    quantity: -qty,
                    balanceAfter: inventory.available,
                    reason: `Transfer to ${transfer.toWarehouseId}`,
                    referenceId: transfer.id,
                    adminId: session.user.id
                }
            });
        }

        await prisma.stockTransfer.update({
            where: { id },
            data: {
                status: 'IN_TRANSIT',
                shippedAt: new Date()
            }
        });

        revalidatePath('/admin/inventory/transfers');
        revalidatePath('/admin/inventory');
        
        return { success: true };
    } catch (error) {
        console.error('Failed to ship transfer:', error);
        return { error: 'Failed to ship transfer' };
    }
}

export async function receiveTransfer(id: string, receivedQuantities?: { itemId: string; receivedQty: number; notes?: string }[]) {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        const transfer = await prisma.stockTransfer.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!transfer) return { error: 'Transfer not found' };
        if (transfer.status !== 'IN_TRANSIT') return { error: 'Transfer is not in transit' };

        // Update received quantities
        for (const item of transfer.items) {
            const received = receivedQuantities?.find(rq => rq.itemId === item.id);
            const qty = received?.receivedQty ?? item.sentQty ?? item.requestedQty;

            await prisma.stockTransferItem.update({
                where: { id: item.id },
                data: { 
                    receivedQty: qty,
                    notes: received?.notes || item.notes
                }
            });

            // Add to destination warehouse
            const existing = await prisma.inventory.findUnique({
                where: {
                    warehouseId_variantId: {
                        warehouseId: transfer.toWarehouseId,
                        variantId: item.variantId
                    }
                }
            });

            if (existing) {
                await prisma.inventory.update({
                    where: { id: existing.id },
                    data: { available: { increment: qty } }
                });
            } else {
                await prisma.inventory.create({
                    data: {
                        warehouseId: transfer.toWarehouseId,
                        variantId: item.variantId,
                        available: qty,
                        reserved: 0,
                        minStock: 5
                    }
                });
            }

            // Get final balance for log
            const finalInventory = await prisma.inventory.findUnique({
                where: {
                    warehouseId_variantId: {
                        warehouseId: transfer.toWarehouseId,
                        variantId: item.variantId
                    }
                }
            });

            await prisma.inventoryLog.create({
                data: {
                    warehouseId: transfer.toWarehouseId,
                    variantId: item.variantId,
                    action: 'TRANSFER_IN',
                    quantity: qty,
                    balanceAfter: finalInventory?.available || qty,
                    reason: `Transfer from ${transfer.fromWarehouseId}`,
                    referenceId: transfer.id,
                    adminId: session.user.id
                }
            });
        }

        await prisma.stockTransfer.update({
            where: { id },
            data: {
                status: 'RECEIVED',
                receivedAt: new Date()
            }
        });

        revalidatePath('/admin/inventory/transfers');
        revalidatePath('/admin/inventory');
        
        return { success: true };
    } catch (error) {
        console.error('Failed to receive transfer:', error);
        return { error: 'Failed to receive transfer' };
    }
}

export async function cancelTransfer(id: string, reason: string) {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        const transfer = await prisma.stockTransfer.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!transfer) return { error: 'Transfer not found' };
        if (['RECEIVED', 'CANCELLED'].includes(transfer.status)) {
            return { error: 'Cannot cancel completed or already cancelled transfer' };
        }

        // If approved, release reserved stock
        if (transfer.status === 'APPROVED') {
            for (const item of transfer.items) {
                await prisma.inventory.update({
                    where: {
                        warehouseId_variantId: {
                            warehouseId: transfer.fromWarehouseId,
                            variantId: item.variantId
                        }
                    },
                    data: {
                        available: { increment: item.requestedQty },
                        reserved: { decrement: item.requestedQty }
                    }
                });
            }
        }

        await prisma.stockTransfer.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelReason: reason
            }
        });

        revalidatePath('/admin/inventory/transfers');
        
        return { success: true };
    } catch (error) {
        console.error('Failed to cancel transfer:', error);
        return { error: 'Failed to cancel transfer' };
    }
}

// Helper: Get inventory items for transfer selection
export async function fetchInventoryForTransfer(warehouseId: string) {
    try {
        await validateAdminSession();
        
        const inventory = await prisma.inventory.findMany({
            where: { 
                warehouseId,
                available: { gt: 0 }
            },
            include: {
                variant: {
                    include: {
                        product: { select: { name: true, imageUrl: true } }
                    }
                }
            },
            orderBy: { variant: { product: { name: 'asc' } } }
        });

        return inventory.map(inv => ({
            variantId: inv.variantId,
            sku: inv.variant.sku,
            productName: inv.variant.product.name,
            productImage: inv.variant.product.imageUrl,
            available: inv.available,
            reserved: inv.reserved
        }));
    } catch (error) {
        console.error('Failed to fetch inventory for transfer:', error);
        return [];
    }
}
