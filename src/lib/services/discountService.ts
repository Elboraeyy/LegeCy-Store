'use server';

import prisma from '@/lib/prisma';

// ==========================================
// Types
// ==========================================

export interface CartItemForDiscount {
    productId: string;
    variantId?: string;
    price: number; // Current price per unit
    quantity: number;
    categoryId?: string;
}

export interface ApplicableDiscount {
    type: 'FLASH_SALE' | 'BOGO' | 'BUNDLE' | 'PRODUCT_OFFER';
    name: string;
    amount: number; // Total discount amount for this type
    details: string; // Human-readable description for receipt
}

export interface DiscountResult {
    originalTotal: number;
    totalDiscount: number;
    finalTotal: number;
    appliedDiscounts: ApplicableDiscount[];
}

// ==========================================
// Main Discount Calculation Function
// ==========================================

/**
 * Calculates all applicable promotions for a cart at checkout time.
 * This is the single source of truth for discount calculations.
 * 
 * Discount Priority (highest to lowest):
 * 1. Flash Sales (already applied to item price in cart)
 * 2. Product Offers (explicit percentage/fixed discounts)
 * 3. BOGO Deals (free/discounted items)
 * 4. Bundles (handled separately as bundle products have fixed bundlePrice)
 * 
 * Note: Coupon codes are handled separately in validateCoupon() and applied on top.
 */
export async function calculateCartDiscounts(cartItems: CartItemForDiscount[]): Promise<DiscountResult> {
    const now = new Date();
    let totalDiscount = 0;
    const appliedDiscounts: ApplicableDiscount[] = [];
    
    // Calculate original total from cart prices (already includes Flash Sale prices)
    const originalTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // ========================================
    // 1. Apply Product Offers
    // ========================================
    const productOfferDiscount = await calculateProductOfferDiscounts(cartItems, now);
    if (productOfferDiscount.amount > 0) {
        totalDiscount += productOfferDiscount.amount;
        appliedDiscounts.push({
            type: 'PRODUCT_OFFER',
            name: 'Product Offers',
            amount: productOfferDiscount.amount,
            details: productOfferDiscount.details
        });
    }

    // ========================================
    // 2. Apply BOGO Deals
    // ========================================
    const bogoDiscount = await calculateBogoDiscounts(cartItems, now);
    if (bogoDiscount.amount > 0) {
        totalDiscount += bogoDiscount.amount;
        appliedDiscounts.push({
            type: 'BOGO',
            name: 'Buy One Get One',
            amount: bogoDiscount.amount,
            details: bogoDiscount.details
        });
    }

    return {
        originalTotal,
        totalDiscount,
        finalTotal: Math.max(0, originalTotal - totalDiscount),
        appliedDiscounts
    };
}

// ==========================================
// Product Offer Calculations
// ==========================================

async function calculateProductOfferDiscounts(
    cartItems: CartItemForDiscount[],
    now: Date
): Promise<{ amount: number; details: string }> {
    let discount = 0;
    const appliedOffers: string[] = [];

    // Fetch all active product offers
    const offers = await prisma.productOffer.findMany({
        where: {
            isActive: true,
            startDate: { lte: now },
            OR: [{ endDate: null }, { endDate: { gt: now } }]
        },
        orderBy: { priority: 'desc' } // Higher priority first
    });

    if (offers.length === 0) return { amount: 0, details: '' };

    for (const item of cartItems) {
        // Find applicable offers for this item
        for (const offer of offers) {
            let applies = false;

            switch (offer.offerType) {
                case 'ALL_PRODUCTS':
                    applies = true;
                    break;
                case 'PRODUCT':
                    applies = offer.targetId === item.productId;
                    break;
                case 'CATEGORY':
                    if (item.categoryId && offer.targetId === item.categoryId) {
                        applies = true;
                    }
                    break;
                // BRAND would require brand info on item
            }

            if (applies && item.quantity >= offer.minQuantity) {
                let itemDiscount = 0;
                
                if (offer.discountType === 'PERCENTAGE') {
                    itemDiscount = (item.price * item.quantity * Number(offer.discountValue)) / 100;
                } else {
                    itemDiscount = Number(offer.discountValue) * item.quantity;
                }

                // Apply max discount cap if set
                if (offer.maxDiscount && itemDiscount > Number(offer.maxDiscount)) {
                    itemDiscount = Number(offer.maxDiscount);
                }

                discount += itemDiscount;
                appliedOffers.push(offer.name);
                
                // Only apply highest priority offer per item (break after first match)
                break;
            }
        }
    }

    return {
        amount: discount,
        details: appliedOffers.length > 0 ? appliedOffers.join(', ') : ''
    };
}

// ==========================================
// BOGO Calculations
// ==========================================

async function calculateBogoDiscounts(
    cartItems: CartItemForDiscount[],
    now: Date
): Promise<{ amount: number; details: string }> {
    let discount = 0;
    const appliedBogos: string[] = [];

    // Fetch all active BOGO deals with their product relations
    const bogos = await prisma.bOGODeal.findMany({
        where: {
            isActive: true,
            startDate: { lte: now },
            OR: [{ endDate: null }, { endDate: { gt: now } }]
        },
        include: {
            products: {
                select: {
                    productId: true,
                    isTrigger: true,
                    isReward: true
                }
            }
        }
    });

    if (bogos.length === 0) return { amount: 0, details: '' };

    for (const bogo of bogos) {
        // Get trigger and reward product IDs
        const triggerProductIds = bogo.products.filter(p => p.isTrigger).map(p => p.productId);
        const rewardProductIds = bogo.products.filter(p => p.isReward).map(p => p.productId);
        
        if (triggerProductIds.length === 0 || rewardProductIds.length === 0) continue;
        
        // Check if any trigger product is in cart with sufficient quantity
        const triggerItem = cartItems.find(item => 
            triggerProductIds.includes(item.productId) && item.quantity >= bogo.buyQuantity
        );
        if (!triggerItem) continue;

        // Check if any reward product is in cart
        const rewardItem = cartItems.find(item => rewardProductIds.includes(item.productId));
        if (!rewardItem) continue;

        // Calculate how many times BOGO can be applied
        const timesApplied = Math.floor(triggerItem.quantity / bogo.buyQuantity);

        // Calculate discount on reward items based on discountPercent
        let bogoDiscount = 0;
        const discountableQty = Math.min(bogo.getQuantity * timesApplied, rewardItem.quantity);
        bogoDiscount = (rewardItem.price * discountableQty * bogo.discountPercent) / 100;

        if (bogoDiscount > 0) {
            discount += bogoDiscount;
            appliedBogos.push(bogo.name);
        }
    }

    return {
        amount: discount,
        details: appliedBogos.length > 0 ? appliedBogos.join(', ') : ''
    };
}

// ==========================================
// Utility: Get Product Category IDs
// ==========================================

export async function enrichCartItemsWithCategories(
    items: { productId: string; variantId?: string; price: number; quantity: number }[]
): Promise<CartItemForDiscount[]> {
    const productIds = items.map(i => i.productId);
    
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, categoryId: true }
    });
    
    const categoryMap = new Map(products.map(p => [p.id, p.categoryId]));
    
    return items.map(item => ({
        ...item,
        categoryId: categoryMap.get(item.productId) || undefined
    }));
}
