'use server';

import { validateCustomerSession } from '@/lib/auth/session';
import { generateLoyaltyCoupon as generateCoupon, getLoyaltyPageData } from '@/lib/services/loyaltyService';
import { revalidatePath } from 'next/cache';

export async function generateLoyaltyCouponAction(pointsToConvert: number) {
    const session = await validateCustomerSession();

    if (!session || !session.user) {
        return { success: false, error: 'يجب تسجيل الدخول أولاً' };
    }

    const result = await generateCoupon({
        userId: session.user.id,
        pointsToConvert
    });

    if (result.success) {
        revalidatePath('/account/loyalty');
        revalidatePath('/account');
    }

    return result;
}

export async function refreshLoyaltyData() {
    const session = await validateCustomerSession();

    if (!session || !session.user) {
        return null;
    }

    return getLoyaltyPageData(session.user.id);
}

