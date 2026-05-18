'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getStockRequests() {
    try {
        const requests = await prisma.stockNotification.findMany({
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true
                    }
                },
                variant: {
                    select: {
                        id: true,
                        sku: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return { success: true, data: requests };
    } catch (error) {
        console.error('Error fetching stock requests:', error);
        return { success: false, error: 'Failed to fetch requests' };
    }
}

export async function updateRequestStatus(id: string, status: 'pending' | 'sent') {
    try {
        await prisma.stockNotification.update({
            where: { id },
            data: { status }
        });
        revalidatePath('/admin/restock-requests');
        return { success: true };
    } catch (error) {
        console.error('Error updating request status:', error);
        return { success: false, error: 'Failed to update status' };
    }
}

export async function deleteRequest(id: string) {
    try {
        await prisma.stockNotification.delete({
            where: { id }
        });
        revalidatePath('/admin/restock-requests');
        return { success: true };
    } catch (error) {
        console.error('Error deleting request:', error);
        return { success: false, error: 'Failed to delete request' };
    }
}
