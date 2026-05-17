'use server';

import { stockNotificationService } from '@/lib/services/stockNotificationService';
import { createAdminNotification } from '@/lib/services/notification';
import prisma from '@/lib/prisma';

export async function subscribeToRestockAction(formData: FormData) {
    const email = formData.get('email') as string;
    const variantId = formData.get('variantId') as string;

    if (!email || !email.includes('@')) {
        return { error: 'Invalid email address' };
    }
    if (!variantId) {
        return { error: 'Variant ID is required' };
    }

    try {
        await stockNotificationService.subscribe(email, variantId);

        // Fetch variant and product name for the notification
        const variantInfo = await prisma.variant.findUnique({
            where: { id: variantId },
            include: { product: { select: { name: true } } }
        });

        if (variantInfo) {
            await createAdminNotification({
                title: 'Restock Requested',
                body: `${email} requested restock for ${variantInfo.product.name} (SKU: ${variantInfo.sku})`,
                category: 'restock',
                referenceId: variantId,
                referenceType: 'Variant'
            });
        }

        return { success: true };
    } catch {
        return { error: 'Failed to subscribe. Please try again.' };
    }
}
