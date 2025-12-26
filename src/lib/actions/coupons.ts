'use server';

import prisma from '@/lib/prisma';

export interface CouponData {
    id: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    minOrderValue: number | null;
    maxDiscount: number | null;
}

export interface CouponValidationResult {
    isValid: boolean;
    error?: string;
    coupon?: CouponData;
    discountAmount?: number;
    finalTotal?: number;
}

export async function validateCoupon(code: string, cartTotal: number): Promise<CouponValidationResult> {
    try {
        if (!code) {
            return { isValid: false, error: 'Coupon code is required' };
        }

        const coupon = await prisma.coupon.findUnique({
            where: { code }
        });

        if (!coupon) {
            return { isValid: false, error: 'Invalid coupon code' };
        }

        if (!coupon.isActive) {
            return { isValid: false, error: 'Coupon is inactive' };
        }

        // Check dates
        const now = new Date();
        if (coupon.startDate > now) {
            return { isValid: false, error: 'Coupon is not yet active' };
        }
        if (coupon.endDate && coupon.endDate < now) {
            return { isValid: false, error: 'Coupon has expired' };
        }

        // Check usage limit
        if (coupon.usageLimit !== null && coupon.currentUsage >= coupon.usageLimit) {
            return { isValid: false, error: 'Coupon usage limit reached' };
        }

        // Check min order value
        if (coupon.minOrderValue && cartTotal < Number(coupon.minOrderValue)) {
            return { 
                isValid: false, 
                error: `Minimum order value of EGP ${coupon.minOrderValue} required` 
            };
        }

        // Calculate discount
        let discountAmount = 0;
        const discountValue = Number(coupon.discountValue);

        if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (cartTotal * discountValue) / 100;
            
            // Cap at max discount if set
            if (coupon.maxDiscount) {
                const maxDiscount = Number(coupon.maxDiscount);
                discountAmount = Math.min(discountAmount, maxDiscount);
            }
        } else {
            // Fixed amount
            discountAmount = discountValue;
        }

        // Ensure discount doesn't exceed total
        discountAmount = Math.min(discountAmount, cartTotal);

        return {
            isValid: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discountType as 'PERCENTAGE' | 'FIXED_AMOUNT',
                discountValue: Number(coupon.discountValue),
                minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
                maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
            },
            discountAmount,
            finalTotal: cartTotal - discountAmount
        };

    } catch (error) {
        console.error('Validate Coupon Error:', error);
        return { isValid: false, error: 'Failed to validate coupon' };
    }
}
