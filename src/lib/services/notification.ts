import prismaClient from '@/lib/prisma';
import admin from '@/lib/firebase-admin';

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

        // Try to send push notifications via Firebase
        try {
            const admins = await prisma.adminUser.findMany({
                where: {
                    isActive: true,
                    fcmToken: { not: null },
                },
                select: { fcmToken: true },
            });

            const tokens = admins.map(a => a.fcmToken).filter(Boolean) as string[];

            if (tokens.length > 0) {
                const payload: admin.messaging.MulticastMessage = {
                    notification: { title, body },
                    data: {
                        category,
                        ...(referenceId && { referenceId }),
                        ...(referenceType && { referenceType }),
                    },
                    android: {
                        priority: 'high',
                    },
                    tokens,
                };
                
                const response = await admin.messaging().sendEachForMulticast(payload);
                console.log(`FCM Notifications sent: ${response.successCount} successful, ${response.failureCount} failed.`);
                
                // Log individual failures for debugging
                if (response.failureCount > 0) {
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            console.error(`FCM token[${idx}] failed:`, resp.error?.message);
                        }
                    });
                }
            } else {
                console.log('No admin users with FCM tokens found.');
            }
        } catch (fcmError) {
            console.error('Failed to send FCM notifications:', fcmError);
        }

        return notification;
    } catch (error) {
        console.error('Failed to create admin notification:', error);
        return null;
    }
}
