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
    brandId?: string;
    materialId?: string;
    pricingContext?: string | null;
    contextId?: string | null;
    bundleConfig?: Record<string, unknown>;
}

export interface ApplicableDiscount {
    type: 'FLASH_SALE' | 'BOGO' | 'BUNDLE' | 'PRODUCT_OFFER' | 'SITEWIDE_OFFER';
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
    // 2. Apply Site-Wide Offer (Only to Standard Items, BEFORE other offers)
    // ---------------------------------------------------------
    let sitewideOfferApplied = false;
    if (standardItems.length > 0) {
        const sitewideDiscount = await calculateSitewideOfferDiscount(standardItems);
        if (sitewideDiscount.amount > 0) {
            totalDiscount += sitewideDiscount.amount;
            appliedDiscounts.push({
                type: 'SITEWIDE_OFFER',
                name: sitewideDiscount.label,
                amount: sitewideDiscount.amount,
                details: sitewideDiscount.details
            });
            sitewideOfferApplied = true;
        }
    }

    // ---------------------------------------------------------
    // 3. Apply Product Offers (Only to Standard Items, skip if sitewide applied)
    // ---------------------------------------------------------
    if (standardItems.length > 0 && !sitewideOfferApplied) {
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
        // 4. Apply BOGO Deals (Only to Standard Items)
        // ---------------------------------------------------------
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
                    if (item.categoryId && offer.targetId === item.categoryId) applies = true;
                    break;
                case 'BRAND':
                    if (item.brandId && offer.targetId === item.brandId) applies = true;
                    break;
                case 'MATERIAL':
                    if (item.materialId && offer.targetId === item.materialId) applies = true;
                    break;
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
// Site-Wide Offer Calculation
// ==========================================

interface SitewideOfferResult {
    amount: number;
    label: string;
    details: string;
}

// Public server action for Checkout client to preview the discount
export async function previewSitewideDiscount(
    items: { price: number; quantity: number }[]
): Promise<SitewideOfferResult> {
    const cartItems: CartItemForDiscount[] = items.map((item, i) => ({
        productId: `preview-${i}`,
        price: item.price,
        quantity: item.quantity,
    }));
    return calculateSitewideOfferDiscount(cartItems);
}

async function calculateSitewideOfferDiscount(
    cartItems: CartItemForDiscount[]
): Promise<SitewideOfferResult> {
    const noDiscount: SitewideOfferResult = { amount: 0, label: '', details: '' };

    try {
        // Fetch settings
        const config = await prisma.storeConfig.findUnique({
            where: { key: 'sitewide_offer_settings' }
        });

        if (!config?.value) return noDiscount;

        const settings = config.value as Record<string, unknown>;
        if (!settings.enabled) return noDiscount;

        // Expand cart items into individual units sorted by price DESCENDING
        // e.g. item with qty=3, price=100 becomes 3 separate entries of 100
        const unitPrices: number[] = [];
        for (const item of cartItems) {
            for (let i = 0; i < item.quantity; i++) {
                unitPrices.push(item.price);
            }
        }
        unitPrices.sort((a, b) => b - a); // Most expensive first

        const totalUnits = unitPrices.length;

        // Tier 3: 3+ items → cheapest free
        if (totalUnits >= 3 && settings.tier3Enabled) {
            // Customer pays for everything EXCEPT the cheapest item.
            // The cheapest item is the last one after sorting desc.
            const cheapestPrice = unitPrices[unitPrices.length - 1];
            const label = (settings.tier3Label as string) || 'Buy 2 Get 1 Free';
            return {
                amount: cheapestPrice,
                label,
                details: `Cheapest item free (-${cheapestPrice} EGP)`
            };
        }

        // Tier 2: 2 items → cheapest at X% off
        if (totalUnits >= 2 && settings.tier2Enabled) {
            const discountPercent = (settings.tier2DiscountPercent as number) || 50;
            const cheapestPrice = unitPrices[unitPrices.length - 1];
            const discountAmount = Math.round(cheapestPrice * discountPercent / 100);
            const label = (settings.tier2Label as string) || `2nd item at ${discountPercent}% off`;
            return {
                amount: discountAmount,
                label,
                details: `${discountPercent}% off cheapest item (-${discountAmount} EGP)`
            };
        }

        // Tier 1: 1 item → X% off
        if (totalUnits >= 1 && settings.tier1Enabled) {
            const discountPercent = (settings.tier1DiscountPercent as number) || 20;
            const itemPrice = unitPrices[0];
            const discountAmount = Math.round(itemPrice * discountPercent / 100);
            const label = (settings.tier1Label as string) || `${discountPercent}% off`;
            return {
                amount: discountAmount,
                label,
                details: `${discountPercent}% off (-${discountAmount} EGP)`
            };
        }

        return noDiscount;
    } catch (error) {
        console.error('Failed to calculate sitewide offer:', error);
        return noDiscount;
    }
}

// ==========================================
// Utility: Get Product Category IDs
// ==========================================

export async function enrichCartItemsWithContext(
    items: { productId: string; variantId?: string; price: number; quantity: number }[]
): Promise<CartItemForDiscount[]> {
    const productIds = items.map(i => i.productId);
    
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, categoryId: true, brandId: true, materialId: true }
    });
    
    const contextMap = new Map(products.map(p => [p.id, p]));
    
    return items.map(item => {
        const p = contextMap.get(item.productId);
        return {
            ...item,
            categoryId: p?.categoryId || undefined,
            brandId: p?.brandId || undefined,
            materialId: p?.materialId || undefined
        };
    });
}

export async function getSitewideOfferConfig() {
    try {
        const config = await prisma.storeConfig.findUnique({
            where: { key: 'sitewide_offer_settings' }
        });
        if (!config?.value) return null;
        return config.value as Record<string, unknown>;
    } catch (error) {
        console.error("Error fetching sitewide config:", error);
        return null;
    }
}

// ==========================================
// Utility: Apply Active Offers to Storefront Products
// ==========================================
export async function applyActiveOffersToProducts<T extends { 
    id: string; 
    price: number; 
    compareAtPrice: number | null; 
    categorySlug?: string | null; 
    brandId?: string | null; 
    materialId?: string | null; 
}>(products: T[]): Promise<T[]> {
    if (products.length === 0) return products;

    const now = new Date();
    // Only apply if no sitewide offer is currently active (to prevent double dipping)
    // Based on calculateCartDiscounts logic
    const sitewideConfig = await getSitewideOfferConfig();
    if (sitewideConfig?.enabled) {
        return products;
    }

    const offers = await prisma.productOffer.findMany({
        where: {
            isActive: true,
            startDate: { lte: now },
            OR: [{ endDate: null }, { endDate: { gt: now } }]
        },
        orderBy: { priority: 'desc' }
    });

    if (offers.length === 0) return products;

    // Fetch product context (categories, brands, materials)
    const productIds = products.map(p => p.id);
    const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, categoryId: true, brandId: true, materialId: true }
    });
    const contextMap = new Map(dbProducts.map(p => [p.id, p]));

    return products.map(product => {
        // DO NOT apply if product already has a manual discount
        if (product.compareAtPrice !== null && product.compareAtPrice > product.price) {
            return product;
        }

        const ctx = contextMap.get(product.id);
        
        for (const offer of offers) {
            let applies = false;
            switch (offer.offerType) {
                case 'ALL_PRODUCTS':
                    applies = true;
                    break;
                case 'PRODUCT':
                    applies = offer.targetId === product.id;
                    break;
                case 'CATEGORY':
                    if (ctx?.categoryId && offer.targetId === ctx.categoryId) applies = true;
                    break;
                case 'BRAND':
                    if (ctx?.brandId && offer.targetId === ctx.brandId) applies = true;
                    break;
                case 'MATERIAL':
                    if (ctx?.materialId && offer.targetId === ctx.materialId) applies = true;
                    break;
            }

            // Only consider offers with minQuantity = 1 for storefront preview
            if (applies && offer.minQuantity <= 1) {
                let discountAmount = 0;
                if (offer.discountType === 'PERCENTAGE') {
                    discountAmount = (product.price * Number(offer.discountValue)) / 100;
                } else {
                    discountAmount = Number(offer.discountValue);
                }

                if (offer.maxDiscount && discountAmount > Number(offer.maxDiscount)) {
                    discountAmount = Number(offer.maxDiscount);
                }

                if (discountAmount > 0) {
                    const newPrice = Math.max(0, product.price - discountAmount);
                    return {
                        ...product,
                        compareAtPrice: product.price, // Original price becomes compareAtPrice
                        price: newPrice
                    };
                }
                break; // Only apply the highest priority offer
            }
        }
        return product;
    });
}
