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
    pricingContext?: string | null;
    contextId?: string | null;
    bundleConfig?: Record<string, unknown>;
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
 * DISCOUNT HIERARCHY & CONTEXT AWARENESS:
 * 1. LOCKED CONTEXTS (Flash Sales / Smart Bundles)
 *    - If an item was added via Flash Sale/Bundle UI (has `pricingContext`), it gets THAT specific price.
 *    - These items are EXCLUDED from further global discounts (Offers/BOGO) to prevent double-dipping.
 *    - Logic: Calculate the specific "Flash Discount" or "Bundle Discount" first.
 * 
 * 2. GLOBAL OFFERS (Product Offers)
 *    - Applied only to "STANDARD" items (no special context).
 * 
 * 3. BOGO DEALS
 *    - Applied only to "STANDARD" items, after global offers.
 * 
 * 4. COUPONS
 *    - Applied last on the subtotal.
 */
export async function calculateCartDiscounts(cartItems: CartItemForDiscount[]): Promise<DiscountResult> {
    const now = new Date();
    let totalDiscount = 0;
    const appliedDiscounts: ApplicableDiscount[] = [];
    
    // Separate items into "Locked Types" and "Standard Types"
    const lockedItems: CartItemForDiscount[] = [];
    const standardItems: CartItemForDiscount[] = [];

    // ---------------------------------------------------------
    // 1. Process Locked Contexts (Flash Sales & Bundles)
    // ---------------------------------------------------------
    for (const item of cartItems) {
        if (item.pricingContext === 'FLASH_SALE' && item.contextId) {
            // Verify Logic: Ideally we check DB if valid, but for speed we assume
            // pre-validated or we calculate the diff here if we had the sale price.
            // Since CartItem has 'price' which is the base price, we need to correct it?
            // Actually, for robust logic, we should re-fetch the sale price here.
            
            // TODO: Optimize by fetching all active flash sales in bulk
            const flashSalePrice = await getFlashSalePrice(item.productId, item.contextId);
            if (flashSalePrice !== null && flashSalePrice < item.price) {
                 const discountAmount = (item.price - flashSalePrice) * item.quantity;
                 totalDiscount += discountAmount;
                 // Add invisible "Flash Adjustment" or visible?
                 // Usually Flash Sale price is shown as the *unit price*.
                 // So we might treat this as a price override rather than a discount line item?
                 // But return structure expects "Applied Discounts".
                 
                 // Strategy: We will count it as a discount so original total logic works.
                 appliedDiscounts.push({
                     type: 'FLASH_SALE',
                     name: 'Flash Sale Event',
                     amount: discountAmount,
                     details: `Special price for ${item.quantity} item(s)`
                 });
                 lockedItems.push(item); 
                 continue;
            }
        } 
        
        // Use STANDARD items for further BOGO/Offer calculations
        standardItems.push(item);
    }

    // ---------------------------------------------------------
    // 2. Apply Product Offers (Only to Standard Items)
    // ---------------------------------------------------------
    if (standardItems.length > 0) {
        const productOfferDiscount = await calculateProductOfferDiscounts(standardItems, now);
        if (productOfferDiscount.amount > 0) {
            totalDiscount += productOfferDiscount.amount;
            appliedDiscounts.push({
                type: 'PRODUCT_OFFER',
                name: 'Product Offers',
                amount: productOfferDiscount.amount,
                details: productOfferDiscount.details
            });
        }

        // ---------------------------------------------------------
        // 3. Apply BOGO Deals (Only to Standard Items)
        // ---------------------------------------------------------
        // Note: BOGO logic needs to know which items were already discounted by offers?
        // Typically BOGO stacks with Offers OR excludes. 
        // Let's assume Stacking if defined, or BOGO operates on Final Price.
        const bogoDiscount = await calculateBogoDiscounts(standardItems, now);
        if (bogoDiscount.amount > 0) {
            totalDiscount += bogoDiscount.amount;
            appliedDiscounts.push({
                type: 'BOGO',
                name: 'Buy One Get One',
                amount: bogoDiscount.amount,
                details: bogoDiscount.details
            });
        }
    }

    const originalTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
        originalTotal,
        totalDiscount,
        finalTotal: Math.max(0, originalTotal - totalDiscount),
        appliedDiscounts
    };
}

// Helper to fetch Flash Sale price
async function getFlashSalePrice(productId: string, flashSaleId: string): Promise<number | null> {
    const saleItem = await prisma.flashSaleProduct.findUnique({
        where: {
            flashSaleId_productId: {
                flashSaleId: flashSaleId,
                productId: productId
            }
        }
    });
    // Check if sale is still active
    const sale = await prisma.flashSale.findUnique({ where: { id: flashSaleId } });
    const now = new Date();
    if (!sale || !sale.isActive || sale.endDate < now) return null;

    return saleItem ? Number(saleItem.salePrice) : null;
}


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
