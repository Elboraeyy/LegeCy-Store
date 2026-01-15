'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { CartItemDTO } from './cart';

// ==========================================
// Types & Interfaces
// ==========================================

export interface CouponData {
    id: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
    discountValue: number;
    minOrderValue: number | null;
    maxDiscount: number | null;
}

export interface CouponValidationResult {
    isValid: boolean;
    error?: string;
    message?: string; // Detailed success/partial message
    coupon?: CouponData;
    discountAmount?: number;
    finalTotal?: number;
    shippingFree?: boolean; // New flag for Free Shipping
}

export interface CouponFilters {
    search?: string;
    status?: 'all' | 'active' | 'inactive' | 'expired' | 'scheduled';
    type?: 'all' | 'PERCENTAGE' | 'FIXED_AMOUNT';
    page?: number;
    limit?: number;
}

export interface CouponInput {
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
    discountValue: number;
    minOrderValue?: number | null;
    maxDiscount?: number | null;
    startDate?: Date | string;
    endDate?: Date | string | null;
    usageLimit?: number | null;
    isActive?: boolean;
}

export interface CouponWithStats {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
    minOrderValue: number | null;
    maxDiscount: number | null;
    startDate: Date;
    endDate: Date | null;
    usageLimit: number | null;
    currentUsage: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    // Calculated stats
    status: 'active' | 'inactive' | 'expired' | 'scheduled';
    totalRevenue?: number;
    totalDiscount?: number;
}

export interface CouponAnalytics {
    totalCoupons: number;
    activeCoupons: number;
    totalUsage: number;
    totalDiscountGiven: number;
    ordersWithCoupons: number;
    conversionRate: number;
    topCoupons: { code: string; usage: number; discount: number }[];
}

// ==========================================
// Helper Functions
// ==========================================

function getCouponStatus(coupon: { isActive: boolean; startDate: Date; endDate: Date | null }): 'active' | 'inactive' | 'expired' | 'scheduled' {
    const now = new Date();
    if (!coupon.isActive) return 'inactive';
    if (coupon.endDate && coupon.endDate < now) return 'expired';
    if (coupon.startDate > now) return 'scheduled';
    return 'active';
}

function generateCouponCode(prefix: string = '', length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = prefix;
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Validates a coupon code with item-level context awareness.
 * Ensures Flash Sale/Bundle items are excluded from discount.
 */
export async function validateCoupon(
    code: string, 
    cartTotal: number, // Legacy param for backward compat, but we calculate real eligible total inside
    userEmail?: string,
    userId?: string,
    cartItems?: CartItemDTO[] // New: Pass items to check context!
): Promise<CouponValidationResult> {
    try {
        if (!code) {
            return { isValid: false, error: 'Coupon code is required' };
        }

        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
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

        // Check global usage limit
        if (coupon.usageLimit !== null && coupon.currentUsage >= coupon.usageLimit) {
            return { isValid: false, error: 'Coupon usage limit reached' };
        }

        // PER-USER USAGE CHECK
        if (userEmail || userId) {
            const existingUsage = await prisma.couponUsage.findFirst({
                where: {
                    couponId: coupon.id,
                    OR: [
                        ...(userEmail ? [{ userEmail }] : []),
                        ...(userId ? [{ userId }] : [])
                    ]
                }
            });
            
            if (existingUsage) {
                return { isValid: false, error: 'You have already used this coupon' };
            }
        }

        // CALCULATE ELIGIBLE TOTAL (Filtering out Flash Sales / Bundles)
        let eligibleTotal = 0;
        let eligibleItemsCount = 0;
        let excludedItemsCount = 0;
        let excludedReason = "";

        if (cartItems && cartItems.length > 0) {
            for (const item of cartItems) {
                // Check Context
                if (item.pricingContext === 'FLASH_SALE' || item.pricingContext === 'BUNDLE') {
                    excludedItemsCount++;
                    excludedReason = item.pricingContext === 'FLASH_SALE' ? "Flash Sale items" : "Bundles";
                } else if (item.pricingContext === 'BOGO' && item.price === 0) {
                     // Free item in BOGO is 0 anyway, but technically excluded from further calc
                     excludedItemsCount++;
                } else {
                    eligibleTotal += (item.price * item.qty);
                    eligibleItemsCount++;
                }
            }
        } else {
            // Fallback if no items passed (legacy or empty)
            eligibleTotal = cartTotal; 
            eligibleItemsCount = 1; // Assume generic
        }

        // Check Min Order Value against ELIGIBLE TOTAL
        if (coupon.minOrderValue && eligibleTotal < Number(coupon.minOrderValue)) {
            // If we have items but they are all excluded
            if (eligibleItemsCount === 0 && excludedItemsCount > 0) {
                 return { 
                    isValid: false, 
                    error: `Coupon not applicable. Cart contains only ${excludedReason} which are excluded from additional discounts.` 
                };
            }
            return { 
                isValid: false, 
                error: `Minimum eligible order value of EGP ${coupon.minOrderValue} required (Flash Sales/Bundles excluded)` 
            };
        }

        // Calculate discount
        let discountAmount = 0;
        const discountValue = Number(coupon.discountValue);
        let isFreeShipping = false;

        if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (eligibleTotal * discountValue) / 100;
            
            // Cap at max discount if set
            if (coupon.maxDiscount) {
                const maxDiscount = Number(coupon.maxDiscount);
                discountAmount = Math.min(discountAmount, maxDiscount);
            }
        } else if (coupon.discountType === 'FIXED_AMOUNT') {
            // Fixed amount is applied once. Warning: if eligibleTotal < fixed, we cap it.
            discountAmount = Math.min(discountValue, eligibleTotal);
        } else if (coupon.discountType === 'FREE_SHIPPING') {
            isFreeShipping = true;
            discountAmount = 0; // Discount is applied on Shipping Line, not Subtotal
        }

        // Ensure discount doesn't exceed total (Double check)
        discountAmount = Math.min(discountAmount, eligibleTotal);

        // Generate Detailed Message
        let message = "Coupon applied successfully!";
        if (excludedItemsCount > 0) {
            if (eligibleItemsCount > 0) {
                 message = `Coupon applied to ${eligibleItemsCount} item(s). ${excludedItemsCount} item(s) excluded (Flash Sale/Bundle/Offer).`; // Partial
            } else if (!isFreeShipping) {
                 // Should have been caught by minOrderValue check technically if min > 0
                 // But if min is 0, we might have 0 discount on 0 eligible total
                 return { isValid: false, error: `Coupon cannot be applied. All items in cart are part of exclusive offers.` }; 
            }
        }
        
        if (isFreeShipping) {
             message = excludedItemsCount > 0 
                ? `Free Shipping applied! Note: ${excludedItemsCount} items are excluded from other discounts.`
                : "Free Shipping applied successfully!";
        }

        return {
            isValid: true,
            message, // Pass the message to UI
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discountType as 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING',
                discountValue: Number(coupon.discountValue),
                minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
                maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
            },
            discountAmount,
            shippingFree: isFreeShipping,
            finalTotal: cartTotal - discountAmount
        };
    } catch (error) {
        console.error('Validate Coupon Error:', error);
        return { isValid: false, error: 'Failed to validate coupon' };
    }
}

export interface CouponFilters {
    search?: string;
    status?: 'all' | 'active' | 'inactive' | 'expired' | 'scheduled';
    type?: 'all' | 'PERCENTAGE' | 'FIXED_AMOUNT';
    page?: number;
    limit?: number;
}

export interface CouponInput {
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
    discountValue: number;
    minOrderValue?: number | null;
    maxDiscount?: number | null;
    startDate?: Date | string;
    endDate?: Date | string | null;
    usageLimit?: number | null;
    isActive?: boolean;
}

export interface CouponWithStats {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
    minOrderValue: number | null;
    maxDiscount: number | null;
    startDate: Date;
    endDate: Date | null;
    usageLimit: number | null;
    currentUsage: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    // Calculated stats
    status: 'active' | 'inactive' | 'expired' | 'scheduled';
    totalRevenue?: number;
    totalDiscount?: number;
}

export interface CouponAnalytics {
    totalCoupons: number;
    activeCoupons: number;
    totalUsage: number;
    totalDiscountGiven: number;
    ordersWithCoupons: number;
    conversionRate: number;
    topCoupons: { code: string; usage: number; discount: number }[];
}



// ==========================================
// CRUD Operations
// ==========================================

/**
 * Get all coupons with optional filtering and pagination
 */
export async function getCoupons(filters: CouponFilters = {}): Promise<{
    coupons: CouponWithStats[];
    total: number;
    page: number;
    totalPages: number;
}> {
    try {
        const { search, status, type, page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;
        const now = new Date();

        // Build where clause
        const where: Record<string, unknown> = {};

        if (search) {
            where.code = { contains: search, mode: 'insensitive' };
        }

        if (type && type !== 'all') {
            where.discountType = type;
        }

        if (status && status !== 'all') {
            switch (status) {
                case 'active':
                    where.isActive = true;
                    where.startDate = { lte: now };
                    where.OR = [
                        { endDate: null },
                        { endDate: { gt: now } }
                    ];
                    break;
                case 'inactive':
                    where.isActive = false;
                    break;
                case 'expired':
                    where.endDate = { lt: now };
                    break;
                case 'scheduled':
                    where.startDate = { gt: now };
                    where.isActive = true;
                    break;
            }
        }

        const [coupons, total] = await Promise.all([
            prisma.coupon.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    _count: {
                        select: { orders: true }
                    }
                }
            }),
            prisma.coupon.count({ where })
        ]);

        const couponsWithStats: CouponWithStats[] = coupons.map(coupon => {
            // Use currentUsage as proxy for orders count and estimate discount
            const estimatedDiscount = coupon.discountType === 'PERCENTAGE' 
                ? coupon.currentUsage * Number(coupon.discountValue) * 10 // Rough estimate
                : coupon.currentUsage * Number(coupon.discountValue);

            return {
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: Number(coupon.discountValue),
                minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
                maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
                startDate: coupon.startDate,
                endDate: coupon.endDate,
                usageLimit: coupon.usageLimit,
                currentUsage: coupon.currentUsage,
                isActive: coupon.isActive,
                createdAt: coupon.createdAt,
                updatedAt: coupon.updatedAt,
                status: getCouponStatus(coupon),
                totalRevenue: 0, // Would need order join for accurate data
                totalDiscount: estimatedDiscount
            };
        });

        return {
            coupons: couponsWithStats,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error('Get Coupons Error:', error);
        throw new Error('Failed to fetch coupons');
    }
}

/**
 * Get a single coupon by ID with full details
 */
export async function getCouponById(id: string): Promise<CouponWithStats | null> {
    try {
        const coupon = await prisma.coupon.findUnique({
            where: { id },
            include: {
                usages: {
                    select: {
                        id: true,
                        userEmail: true,
                        usedAt: true
                    },
                    orderBy: { usedAt: 'desc' },
                    take: 50
                }
            }
        });

        if (!coupon) return null;

        // Estimate discount based on usage and discount value
        const estimatedDiscount = coupon.discountType === 'PERCENTAGE'
            ? coupon.currentUsage * Number(coupon.discountValue) * 10
            : coupon.currentUsage * Number(coupon.discountValue);

        return {
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: Number(coupon.discountValue),
            minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
            maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
            startDate: coupon.startDate,
            endDate: coupon.endDate,
            usageLimit: coupon.usageLimit,
            currentUsage: coupon.currentUsage,
            isActive: coupon.isActive,
            createdAt: coupon.createdAt,
            updatedAt: coupon.updatedAt,
            status: getCouponStatus(coupon),
            totalRevenue: 0,
            totalDiscount: estimatedDiscount
        };
    } catch (error) {
        console.error('Get Coupon By ID Error:', error);
        throw new Error('Failed to fetch coupon');
    }
}

/**
 * Create a new coupon
 */
export async function createCoupon(input: CouponInput): Promise<{ success: boolean; coupon?: CouponWithStats; error?: string }> {
    try {
        // Check if code already exists
        const existingCoupon = await prisma.coupon.findUnique({
            where: { code: input.code.toUpperCase() }
        });

        if (existingCoupon) {
            return { success: false, error: 'Coupon code already exists' };
        }

        const coupon = await prisma.coupon.create({
            data: {
                code: input.code.toUpperCase(),
                discountType: input.discountType,
                discountValue: input.discountValue,
                minOrderValue: input.minOrderValue ?? null,
                maxDiscount: input.maxDiscount ?? null,
                startDate: input.startDate ? new Date(input.startDate) : new Date(),
                endDate: input.endDate ? new Date(input.endDate) : null,
                usageLimit: input.usageLimit ?? null,
                isActive: input.isActive ?? true
            }
        });

        revalidatePath('/admin/promos');

        return {
            success: true,
            coupon: {
                ...coupon,
                discountValue: Number(coupon.discountValue),
                minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
                maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
                status: getCouponStatus(coupon)
            }
        };
    } catch (error) {
        console.error('Create Coupon Error:', error);
        return { success: false, error: 'Failed to create coupon' };
    }
}

/**
 * Update an existing coupon
 */
export async function updateCoupon(id: string, input: Partial<CouponInput>): Promise<{ success: boolean; coupon?: CouponWithStats; error?: string }> {
    try {
        // Check if new code already exists (if code is being changed)
        if (input.code) {
            const existingCoupon = await prisma.coupon.findFirst({
                where: {
                    code: input.code.toUpperCase(),
                    NOT: { id }
                }
            });

            if (existingCoupon) {
                return { success: false, error: 'Coupon code already exists' };
            }
        }

        const updateData: Record<string, unknown> = {};
        if (input.code) updateData.code = input.code.toUpperCase();
        if (input.discountType) updateData.discountType = input.discountType;
        if (input.discountValue !== undefined) updateData.discountValue = input.discountValue;
        if (input.minOrderValue !== undefined) updateData.minOrderValue = input.minOrderValue;
        if (input.maxDiscount !== undefined) updateData.maxDiscount = input.maxDiscount;
        if (input.startDate !== undefined) updateData.startDate = input.startDate ? new Date(input.startDate) : new Date();
        if (input.endDate !== undefined) updateData.endDate = input.endDate ? new Date(input.endDate) : null;
        if (input.usageLimit !== undefined) updateData.usageLimit = input.usageLimit;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        const coupon = await prisma.coupon.update({
            where: { id },
            data: updateData
        });

        revalidatePath('/admin/promos');

        return {
            success: true,
            coupon: {
                ...coupon,
                discountValue: Number(coupon.discountValue),
                minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
                maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
                status: getCouponStatus(coupon)
            }
        };
    } catch (error) {
        console.error('Update Coupon Error:', error);
        return { success: false, error: 'Failed to update coupon' };
    }
}

/**
 * Delete (deactivate) a coupon
 */
export async function deleteCoupon(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.coupon.update({
            where: { id },
            data: { isActive: false }
        });

        revalidatePath('/admin/promos');
        return { success: true };
    } catch (error) {
        console.error('Delete Coupon Error:', error);
        return { success: false, error: 'Failed to delete coupon' };
    }
}

/**
 * Toggle coupon active status
 */
export async function toggleCouponStatus(id: string): Promise<{ success: boolean; isActive?: boolean; error?: string }> {
    try {
        const coupon = await prisma.coupon.findUnique({ where: { id } });
        if (!coupon) {
            return { success: false, error: 'Coupon not found' };
        }

        const updated = await prisma.coupon.update({
            where: { id },
            data: { isActive: !coupon.isActive }
        });

        revalidatePath('/admin/promos');
        return { success: true, isActive: updated.isActive };
    } catch (error) {
        console.error('Toggle Coupon Status Error:', error);
        return { success: false, error: 'Failed to toggle coupon status' };
    }
}

/**
 * Duplicate a coupon with a new code
 */
export async function duplicateCoupon(id: string, newCode?: string): Promise<{ success: boolean; coupon?: CouponWithStats; error?: string }> {
    try {
        const original = await prisma.coupon.findUnique({ where: { id } });
        if (!original) {
            return { success: false, error: 'Original coupon not found' };
        }

        const code = newCode?.toUpperCase() || generateCouponCode(original.code.slice(0, 2) + '-');

        // Check if code exists
        const existing = await prisma.coupon.findUnique({ where: { code } });
        if (existing) {
            return { success: false, error: 'Coupon code already exists' };
        }

        const coupon = await prisma.coupon.create({
            data: {
                code,
                discountType: original.discountType,
                discountValue: original.discountValue,
                minOrderValue: original.minOrderValue,
                maxDiscount: original.maxDiscount,
                startDate: new Date(),
                endDate: original.endDate,
                usageLimit: original.usageLimit,
                isActive: false // Start as inactive
            }
        });

        revalidatePath('/admin/promos');

        return {
            success: true,
            coupon: {
                ...coupon,
                discountValue: Number(coupon.discountValue),
                minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
                maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
                status: getCouponStatus(coupon)
            }
        };
    } catch (error) {
        console.error('Duplicate Coupon Error:', error);
        return { success: false, error: 'Failed to duplicate coupon' };
    }
}

/**
 * Bulk create coupons with generated codes
 */
export async function bulkCreateCoupons(params: {
    prefix: string;
    count: number;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    minOrderValue?: number | null;
    maxDiscount?: number | null;
    startDate?: Date | string;
    endDate?: Date | string | null;
    usageLimit?: number | null;
}): Promise<{ success: boolean; count?: number; codes?: string[]; error?: string }> {
    try {
        const codes: string[] = [];
        const createdCoupons = [];

        for (let i = 0; i < params.count; i++) {
            let code = generateCouponCode(params.prefix);
            let attempts = 0;

            // Ensure unique code
            while (await prisma.coupon.findUnique({ where: { code } }) && attempts < 10) {
                code = generateCouponCode(params.prefix);
                attempts++;
            }

            if (attempts >= 10) {
                return { success: false, error: 'Could not generate unique codes' };
            }

            codes.push(code);
            createdCoupons.push({
                code,
                discountType: params.discountType,
                discountValue: params.discountValue,
                minOrderValue: params.minOrderValue ?? null,
                maxDiscount: params.maxDiscount ?? null,
                startDate: params.startDate ? new Date(params.startDate) : new Date(),
                endDate: params.endDate ? new Date(params.endDate) : null,
                usageLimit: params.usageLimit ?? null,
                isActive: true
            });
        }

        await prisma.coupon.createMany({
            data: createdCoupons
        });

        revalidatePath('/admin/promos');

        return { success: true, count: codes.length, codes };
    } catch (error) {
        console.error('Bulk Create Coupons Error:', error);
        return { success: false, error: 'Failed to create coupons' };
    }
}

/**
 * Get coupon analytics
 */
export async function getCouponAnalytics(): Promise<CouponAnalytics> {
    try {
        const now = new Date();

        const [totalCoupons, activeCoupons, allCoupons, ordersWithCoupons, totalOrders] = await Promise.all([
            prisma.coupon.count(),
            prisma.coupon.count({
                where: {
                    isActive: true,
                    startDate: { lte: now },
                    OR: [
                        { endDate: null },
                        { endDate: { gt: now } }
                    ]
                }
            }),
            prisma.coupon.findMany({
                orderBy: { currentUsage: 'desc' },
                take: 10
            }),
            prisma.order.count({
                where: { couponId: { not: null } }
            }),
            prisma.order.count()
        ]);

        const totalUsage = allCoupons.reduce((sum, c) => sum + c.currentUsage, 0);
        // Estimate based on discount values and usage
        const totalDiscountGiven = allCoupons.reduce((sum, c) => {
            const estimated = c.discountType === 'PERCENTAGE'
                ? c.currentUsage * Number(c.discountValue) * 10
                : c.currentUsage * Number(c.discountValue);
            return sum + estimated;
        }, 0);

        const topCoupons = allCoupons.slice(0, 5).map(c => {
            const estimated = c.discountType === 'PERCENTAGE'
                ? c.currentUsage * Number(c.discountValue) * 10
                : c.currentUsage * Number(c.discountValue);
            return {
                code: c.code,
                usage: c.currentUsage,
                discount: estimated
            };
        });

        return {
            totalCoupons,
            activeCoupons,
            totalUsage,
            totalDiscountGiven,
            ordersWithCoupons,
            conversionRate: totalOrders > 0 ? (ordersWithCoupons / totalOrders) * 100 : 0,
            topCoupons
        };
    } catch (error) {
        console.error('Get Coupon Analytics Error:', error);
        return {
            totalCoupons: 0,
            activeCoupons: 0,
            totalUsage: 0,
            totalDiscountGiven: 0,
            ordersWithCoupons: 0,
            conversionRate: 0,
            topCoupons: []
        };
    }
}


