'use server';

import { validateAdminSession } from '@/lib/auth/session';
import { stockTransferService } from '@/lib/services/stockTransferService';
import { inventoryService } from '@/lib/services/inventoryService';
import { revalidatePath } from 'next/cache';

export async function createTransfer(data: { fromWarehouseId: string; toWarehouseId: string; notes?: string; items: { variantId: string; quantity: number }[] }) {
    const session = await validateAdminSession();
    if (!session.user) return { error: 'Unauthorized' };

    try {
        await stockTransferService.createTransfer({
            ...data,
            createdById: session.user.id
        });
        revalidatePath('/admin/inventory/transfers');
        return { success: true };
    } catch (error) {
        console.error('Failed to create transfer:', error);
        return { error: 'Failed to create transfer' };
    }
}

export async function fetchInventoryForTransfer(warehouseId: string) {
    await validateAdminSession();
    return await inventoryService.getInventoryByWarehouse(warehouseId);
}
