'use server';

import prismaClient from '@/lib/prisma';
import { validateAdminSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

const prisma = prismaClient!;

// --- Types ---

export type InventoryItemPro = {
    id: string; // Inventory ID
    variantId: string;
    productId: string;
    warehouseId: string;
    
    sku: string;
    productName: string;
    productImage: string | null;
    warehouseName: string;
    
    available: number;
    reserved: number;
    minStock: number;
    
    status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    updatedAt: Date;
};

export type FetchInventoryParams = {
    page?: number;
    limit?: number;
    search?: string;
    warehouseId?: string;
    status?: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ALL';
};

// --- Actions ---

export async function fetchInventoryPro(params: FetchInventoryParams) {
    try {
        await validateAdminSession();
        
        const page = params.page || 1;
        const limit = params.limit || 20;
        const skip = (page - 1) * limit;

        // Build Where Clause
        const where: Prisma.InventoryWhereInput = {};

        if (params.warehouseId && params.warehouseId !== 'ALL') {
            where.warehouseId = params.warehouseId;
        }

        if (params.search) {
            where.OR = [
                { variant: { sku: { contains: params.search, mode: 'insensitive' } } },
                { variant: { product: { name: { contains: params.search, mode: 'insensitive' } } } }
            ];
        }

        const [items, totalCount] = await prisma.$transaction([
             prisma.inventory.findMany({
                 where,
                 include: {
                     variant: {
                         include: { product: { select: { name: true, imageUrl: true } } }
                     },
                     warehouse: { select: { name: true } }
                 },
                 orderBy: { updatedAt: 'desc' },
                 skip: params.status ? undefined : skip, 
                 take: params.status ? undefined : limit,
             }),
             prisma.inventory.count({ where })
        ]);

        // Transform
        let formattedItems: InventoryItemPro[] = items.map(item => {
            let status: InventoryItemPro['status'] = 'IN_STOCK';
            if (item.available === 0) status = 'OUT_OF_STOCK';
            else if (item.available <= item.minStock) status = 'LOW_STOCK';

            return {
                id: item.id,
                variantId: item.variantId,
                productId: item.variant.productId,
                warehouseId: item.warehouseId,
                sku: item.variant.sku,
                productName: item.variant.product.name,
                productImage: item.variant.product.imageUrl,
                warehouseName: item.warehouse.name,
                available: item.available,
                reserved: item.reserved,
                minStock: item.minStock,
                status,
                updatedAt: item.updatedAt
            };
        });

        // Apply Status Filter in Memory if requested
        if (params.status && params.status !== 'ALL') {
             formattedItems = formattedItems.filter(i => i.status === params.status);
             // Re-paginate in memory
             const totalFiltered = formattedItems.length;
             const start = (page - 1) * limit;
             formattedItems = formattedItems.slice(start, start + limit);
             return {
                 data: formattedItems,
                 meta: {
                     total: totalFiltered, 
                     page,
                     totalPages: Math.ceil(totalFiltered / limit)
                 }
             };
        }

        return {
            data: formattedItems,
            meta: {
                total: totalCount,
                page,
                totalPages: Math.ceil(totalCount / limit)
            }
        };

    } catch (e) {
        console.error(e);
        return { error: 'Failed to fetch inventory' };
    }
}

export async function adjustStockPro(data: {
    variantId: string;
    warehouseId: string;
    quantity: number; // Delta (+5, -2)
    reason: string;
    minStock?: number;
}) {
    const session = await validateAdminSession();
    if (!session.user) return { error: 'Unauthorized' };

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get Current
            const current = await tx.inventory.findUnique({
                where: { warehouseId_variantId: { warehouseId: data.warehouseId, variantId: data.variantId } }
            });

            if (!current) throw new Error('Inventory record not found');

            const newBalance = current.available + data.quantity;
            if (newBalance < 0) throw new Error(`Insufficient stock. Current: ${current.available}, Requested Change: ${data.quantity}`);

            // 2. Update Inventory
            const updated = await tx.inventory.update({
                where: { id: current.id },
                data: {
                    available: newBalance,
                    minStock: data.minStock !== undefined ? data.minStock : current.minStock
                }
            });

            // 3. Create Log
            await tx.inventoryLog.create({
                data: {
                    warehouseId: data.warehouseId,
                    variantId: data.variantId,
                    action: 'ADJUST',
                    quantity: data.quantity,
                    balanceAfter: newBalance,
                    reason: data.reason,
                    adminId: session.user.id
                }
            });

            return updated;
        });

        revalidatePath('/admin/inventory');
        return { success: true, data: result };
    } catch (e: unknown) {
        console.error(e);
        const message = e instanceof Error ? e.message : 'Adjustment failed';
        return { error: message };
    }
}

export async function transferStock(data: {
    variantId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    reason: string;
}) {
    const session = await validateAdminSession();
    if (!session.user) return { error: 'Unauthorized' };

    if (data.quantity <= 0) return { error: 'Quantity must be positive' };
    if (data.fromWarehouseId === data.toWarehouseId) return { error: 'Source and destination must be different' };

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Check Source
            const source = await tx.inventory.findUnique({
                where: { warehouseId_variantId: { warehouseId: data.fromWarehouseId, variantId: data.variantId } }
            });

            if (!source || source.available < data.quantity) {
                 throw new Error(`Insufficient stock at source warehouse.`);
            }

            // 2. Decrement Source
            const newSourceBalance = source.available - data.quantity;
            await tx.inventory.update({
                where: { id: source.id },
                data: { available: newSourceBalance }
            });

            await tx.inventoryLog.create({
                data: {
                    warehouseId: data.fromWarehouseId,
                    variantId: data.variantId,
                    action: 'TRANSFER_OUT',
                    quantity: -data.quantity,
                    balanceAfter: newSourceBalance,
                    reason: `Transfer to ${data.toWarehouseId}. ${data.reason}`,
                    adminId: session.user.id
                }
            });

            // 3. Increment Destination (Upsert if not exists)
            // Need to check if dest exists first to get balance for log
            let dest = await tx.inventory.findUnique({
                where: { warehouseId_variantId: { warehouseId: data.toWarehouseId, variantId: data.variantId } }
            });

            let newDestBalance = data.quantity;

            if (dest) {
                newDestBalance = dest.available + data.quantity;
                await tx.inventory.update({
                    where: { id: dest.id },
                    data: { available: { increment: data.quantity } }
                });
            } else {
                // Create new record
                dest = await tx.inventory.create({
                    data: {
                        warehouseId: data.toWarehouseId,
                        variantId: data.variantId,
                        available: data.quantity,
                        minStock: 5 // Default
                    }
                });
            }

            await tx.inventoryLog.create({
                data: {
                    warehouseId: data.toWarehouseId,
                    variantId: data.variantId,
                    action: 'TRANSFER_IN',
                    quantity: data.quantity,
                    balanceAfter: newDestBalance,
                    reason: `Transfer from ${data.fromWarehouseId}. ${data.reason}`,
                    adminId: session.user.id,
                    referenceId: source.id // Linking somewhat loosely
                }
            });
        });

        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (e: unknown) {
        console.error(e);
        const message = e instanceof Error ? e.message : 'Transfer failed';
        return { error: message };
    }
}

export async function fetchAllWarehouses() {
    return await prisma.warehouse.findMany({ select: { id: true, name: true }});
}
