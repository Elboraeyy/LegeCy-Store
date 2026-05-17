import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

export type NotificationCategory = 'order' | 'inventory' | 'review' | 'message' | 'restock' | 'finance' | 'system';

export async function createAdminNotification({
    title,
    body,
    category = 'system',
    referenceId,
    referenceType,
}: {
    title: string;
    body: string;
    category?: NotificationCategory;
    referenceId?: string;
    referenceType?: string;
}) {
    try {
        const notification = await prisma.adminNotification.create({
            data: {
                title,
                body,
                category,
                referenceId,
                referenceType,
            },
        });
        return notification;
    } catch (error) {
        console.error('Failed to create admin notification:', error);
        return null;
    }
}
