'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';
import { auditService } from '@/lib/services/auditService';

export interface OrderNote {
    id: string;
    content: string;
    adminName: string;
    createdAt: string;
}

export async function getOrderNotes(orderId: string): Promise<OrderNote[]> {
    await requireAdminPermission(AdminPermissions.ORDERS.READ);

    const notes = await prisma.orderNote.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
        include: {
            admin: { select: { name: true, email: true } }
        }
    });

    return notes.map(n => ({
        id: n.id,
        content: n.content,
        adminName: n.admin.name || n.admin.email,
        createdAt: n.createdAt.toISOString()
    }));
}

export async function createOrderNote(orderId: string, content: string): Promise<{ success: boolean; error?: string }> {
    try {
        const admin = await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);

        if (!content.trim()) {
            return { success: false, error: 'Note content cannot be empty' };
        }

        await prisma.orderNote.create({
            data: {
                orderId,
                adminId: admin.id,
                content: content.trim()
            }
        });

        await auditService.logAction(admin.id, 'CREATE_ORDER_NOTE', 'ORDER', orderId, { notePreview: content.slice(0, 50) });

        revalidatePath(`/admin/orders/${orderId}`);
        return { success: true };
    } catch (error) {
        console.error('Create Note Error:', error);
        return { success: false, error: 'Failed to create note' };
    }
}

export async function deleteOrderNote(noteId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);

        const note = await prisma.orderNote.findUnique({
            where: { id: noteId },
            select: { orderId: true }
        });

        if (!note) {
            return { success: false, error: 'Note not found' };
        }

        await prisma.orderNote.delete({ where: { id: noteId } });

        revalidatePath(`/admin/orders/${note.orderId}`);
        return { success: true };
    } catch (error) {
        console.error('Delete Note Error:', error);
        return { success: false, error: 'Failed to delete note' };
    }
}
