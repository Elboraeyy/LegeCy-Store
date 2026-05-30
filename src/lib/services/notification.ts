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
                const payload: any = {
                    notification: { title, body },
                    data: {
                        category,
                        ...(referenceId && { referenceId }),
                        ...(referenceType && { referenceType }),
                    },
                    android: {
                        priority: 'high',
                        notification: {
                            channelId: category ? `legacy_${category}` : 'legacy_system',
                        }
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: 'default',
                            }
                        }
                    },
                    tokens,
                };
                
                const response = await admin.messaging().sendEachForMulticast(payload);
                console.log(`FCM Notifications sent: ${response.successCount} successful, ${response.failureCount} failed.`);
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
