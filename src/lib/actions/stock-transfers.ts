'use server';

import { stockTransferService } from '@/lib/services/stockTransferService';
import { revalidatePath } from 'next/cache';

export async function createTransferAction(formData: FormData) {
    const fromId = formData.get('fromWarehouseId') as string;
    const toId = formData.get('toWarehouseId') as string;
    const notes = formData.get('notes') as string;

    // Parse Items (VariantId, Qty)
    const variants = formData.getAll('variantId');
    const quantities = formData.getAll('quantity');

    const items = variants.map((v, i) => ({
        variantId: v as string,
        quantity: Number(quantities[i])
    }));

    // TODO: Get real admin ID
    const adminId = 'system-admin';

    await stockTransferService.createTransfer({
        fromWarehouseId: fromId,
        toWarehouseId: toId,
        notes,
        createdById: adminId,
        items
    });

    revalidatePath('/admin/inventory/transfers');
}

export async function approveTransferAction(id: string) {
    await stockTransferService.approveTransfer(id, 'system-admin');
    revalidatePath('/admin/inventory/transfers');
}

export async function shipTransferAction(id: string) {
    await stockTransferService.shipTransfer(id);
    revalidatePath('/admin/inventory/transfers');
}

export async function receiveTransferAction(id: string) {
    await stockTransferService.receiveTransfer(id);
    revalidatePath('/admin/inventory/transfers');
}

export async function getTransfersAction() {
    return await stockTransferService.getTransfers();
}
