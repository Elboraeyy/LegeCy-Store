'use server';

import { stockNotificationService } from '@/lib/services/stockNotificationService';
import { z } from 'zod';

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
        return { success: true };
    } catch (error) {
        return { error: 'Failed to subscribe. Please try again.' };
    }
}
