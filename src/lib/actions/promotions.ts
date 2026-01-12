'use server';

import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/guards';
import { revalidatePath } from 'next/cache';

// ==========================================
// Types
// ==========================================

export type FlashSaleInput = {
    name: string;
    description?: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    startDate: string; // ISO string
    endDate: string; // ISO string
    maxQuantity?: number;
    isActive: boolean;
    showOnHomepage: boolean;
    productIds: string[]; // IDs of products to include
};

export type FlashSaleWithStats = {
    id: string;
    name: string;
    description: string | null;
    discountType: string;
    discountValue: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    showOnHomepage: boolean;
    productCount: number;
    soldCount: number;
    revenue: number;
    status: 'active' | 'scheduled' | 'expired' | 'inactive';
};

export type ProductSearchResult = {
    id: string;
    name: string;
    price: number;
    image: string | null;
};

// ==========================================
// Flash Sale Actions
// ==========================================

export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
    await requireAdmin();
    
    if (!query || query.length < 2) return [];

    const products = await prisma.product.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { id: { contains: query } }
            ]
        },
        select: {
            id: true,
            name: true,
            imageUrl: true,
            variants: {
                select: { price: true },
                take: 1
            }
        },
        take: 10
    });

    return products.map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.variants[0]?.price || 0),
        image: p.imageUrl
    }));
}

export async function getFlashSales(status?: string) {
    await requireAdmin();

    const now = new Date();

    const flashSales = await prisma.flashSale.findMany({
        where: status === 'active' ? {
            isActive: true,
            startDate: { lte: now },
            endDate: { gt: now }
        } : status === 'scheduled' ? {
            isActive: true,
            startDate: { gt: now }
        } : status === 'expired' ? {
            endDate: { lte: now }
        } : status === 'inactive' ? {
            isActive: false
        } : undefined,
        include: {
            products: {
                select: {
                    soldQuantity: true,
                    salePrice: true
                }
            },
            _count: {
                select: { products: true }
            }
        },
        orderBy: { startDate: 'desc' }
    });

    // Transform and calculate stats
    return flashSales.map(sale => {
        const isExpired = sale.endDate <= now;
        const isScheduled = sale.startDate > now;
        
        let calculatedStatus: FlashSaleWithStats['status'] = 'inactive';
        if (sale.isActive) {
            if (isExpired) calculatedStatus = 'expired';
            else if (isScheduled) calculatedStatus = 'scheduled';
            else calculatedStatus = 'active';
        }

        const soldCount = sale.products.reduce((acc, p) => acc + p.soldQuantity, 0);
        const revenue = sale.products.reduce((acc, p) => acc + (Number(p.salePrice) * p.soldQuantity), 0);

        return {
            id: sale.id,
            name: sale.name,
            description: sale.description,
            discountType: sale.discountType,
            discountValue: Number(sale.discountValue),
            startDate: sale.startDate,
            endDate: sale.endDate,
            isActive: sale.isActive,
            showOnHomepage: sale.showOnHomepage,
            productCount: sale._count.products,
            soldCount,
            revenue,
            status: calculatedStatus
        };
    });
}

export async function createFlashSale(data: FlashSaleInput) {
    await requireAdmin();

    try {
        // Validate dates
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);

        if (end <= start) {
            return { success: false, error: 'End date must be after start date' };
        }

        // Products don't have a direct price field - prices are on Variants
        // This product list was unused anyway since we fetch separately with variants below
        
        // Note: Product model might use Variant price. Let's assume we use the base price or handle later.
        // Checking schema: Product has 'variants'. It doesn't seem to have a direct 'price'. 
        // Let's modify this to verify product structure or just use 0 for now and fix after checking schema.
        // Actually, schema viewer showed Product has 'variants' and 'costPrice'. 
        // Standard E-commerce usually has a base price or range. 
        // Let's defer price calculation complexity by just linking them for now, 
        // or check Product model again.
        
        // Let's proceed with creating the FlashSale first, and linking products.
        // We will assume for now we just link them.
        
        const result = await prisma.$transaction(async (tx) => {
            // Create Flash Sale
            const flashSale = await tx.flashSale.create({
                data: {
                    name: data.name,
                    description: data.description,
                    discountType: data.discountType,
                    discountValue: data.discountValue,
                    startDate: start,
                    endDate: end,
                    maxQuantity: data.maxQuantity,
                    isActive: data.isActive,
                    showOnHomepage: data.showOnHomepage,
                }
            });

            // Create Flash Sale Products
            // We need to fetch original prices. 
            // Since Product -> Variants logic is complex, 
            // for now we will just create the entries. 
            // In a real scenario, we'd pick a specific variant or apply to all.
            // Let's assume we apply to the main product context.
            
            // For this implementation, I'll iterate and create simple links.
            // I'll assume 0 for prices if not easily accessible, to be refined.
            
            if (data.productIds.length > 0) {
                 // We need to get some price reference. 
                 // Let's fetch variants to get the lowest price as "originalPrice"
                 const productsWithPrice = await tx.product.findMany({
                    where: { id: { in: data.productIds } },
                    include: { variants: { select: { price: true }, take: 1 } }
                 });

                 for (const product of productsWithPrice) {
                    const originalPrice = Number(product.variants[0]?.price || 0);
                    let salePrice = originalPrice;

                    if (data.discountType === 'PERCENTAGE') {
                        salePrice = originalPrice * (1 - data.discountValue / 100);
                    } else {
                        salePrice = Math.max(0, originalPrice - data.discountValue);
                    }

                    await tx.flashSaleProduct.create({
                        data: {
                            flashSaleId: flashSale.id,
                            productId: product.id,
                            originalPrice: originalPrice,
                            salePrice: salePrice,
                            maxQuantity: data.maxQuantity // Global max applied to each, or we could split it
                        }
                    });
                 }
            }
            
            return flashSale;
        });

        revalidatePath('/admin/promos');
        return { success: true, id: result.id };

    } catch (error) {
        console.error('Failed to create flash sale:', error);
        return { success: false, error: 'Failed to create flash sale' };
    }
}

export async function toggleFlashSaleStatus(id: string) {
    await requireAdmin();

    try {
        const flashSale = await prisma.flashSale.findUnique({ where: { id } });
        if (!flashSale) return { success: false, error: 'Flash sale not found' };

        await prisma.flashSale.update({
            where: { id },
            data: { isActive: !flashSale.isActive }
        });

        revalidatePath('/admin/promos');
        return { success: true, isActive: !flashSale.isActive };
    } catch (error) {
        console.error('Failed to toggle flash sale status:', error);
        return { success: false, error: 'Failed to update status' };
    }
}

export async function deleteFlashSale(id: string) {
    await requireAdmin();
    try {
        await prisma.flashSale.delete({ where: { id } });
        revalidatePath('/admin/promos');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete flash sale:', error);
        return { success: false, error: 'Failed to delete flash sale' };
    }
}

// ==========================================
// BOGO Actions
// ==========================================

export type BOGOInput = {
    name: string;
    description?: string;
    dealType: 'BUY_X_GET_Y_FREE' | 'BUY_X_GET_Y_DISCOUNT';
    buyQuantity: number;
    getQuantity: number; // e.g., Buy 2 Get 1
    discountPercent: number; // 100 for free, 50 for half off
    mixAndMatch: boolean;
    startDate: string;
    endDate?: string;
    usageLimit?: number;
    isActive: boolean;
    buyProductIds: string[]; // Products that trigger the deal
    getProductIds: string[]; // Products that are the reward (can be same as buy)
};

export type BOGOWithStats = {
    id: string;
    name: string;
    description: string | null;
    dealType: string;
    buyQuantity: number;
    getQuantity: number;
    discountPercent: number;
    startDate: Date;
    endDate: Date | null;
    isActive: boolean;
    usageLimit: number | null;
    currentUsage: number;
    status: 'active' | 'scheduled' | 'expired' | 'inactive';
};

export async function getBOGODeals(status?: string) {
    await requireAdmin();

    const now = new Date();

    const deals = await prisma.bOGODeal.findMany({
        where: status === 'active' ? {
            isActive: true,
            startDate: { lte: now },
            OR: [{ endDate: null }, { endDate: { gt: now } }]
        } : status === 'scheduled' ? {
            isActive: true,
            startDate: { gt: now }
        } : status === 'expired' ? {
            endDate: { lte: now }
        } : status === 'inactive' ? {
            isActive: false
        } : undefined,
        orderBy: { startDate: 'desc' }
    });

    return deals.map(deal => {
        const isExpired = deal.endDate ? deal.endDate <= now : false;
        const isScheduled = deal.startDate > now;
        
        let calculatedStatus: BOGOWithStats['status'] = 'inactive';
        if (deal.isActive) {
            if (isExpired) calculatedStatus = 'expired';
            else if (isScheduled) calculatedStatus = 'scheduled';
            else calculatedStatus = 'active';
        }

        return {
            id: deal.id,
            name: deal.name,
            description: deal.description,
            dealType: deal.dealType,
            buyQuantity: deal.buyQuantity,
            getQuantity: deal.getQuantity,
            discountPercent: deal.discountPercent,
            startDate: deal.startDate,
            endDate: deal.endDate,
            isActive: deal.isActive,
            usageLimit: deal.usageLimit,
            currentUsage: deal.currentUsage,
            status: calculatedStatus
        };
    });
}

export async function createBOGODeal(data: BOGOInput) {
    await requireAdmin();

    try {
        const start = new Date(data.startDate);
        const end = data.endDate ? new Date(data.endDate) : null;

        if (end && end <= start) {
            return { success: false, error: 'End date must be after start date' };
        }

        const result = await prisma.$transaction(async (tx) => {
            const bogo = await tx.bOGODeal.create({
                data: {
                    name: data.name,
                    description: data.description,
                    dealType: data.dealType,
                    buyQuantity: data.buyQuantity,
                    getQuantity: data.getQuantity,
                    discountPercent: data.discountPercent,
                    mixAndMatch: data.mixAndMatch,
                    startDate: start,
                    endDate: end,
                    usageLimit: data.usageLimit,
                    isActive: data.isActive
                }
            });

            // Handle Products
            // We need to deduplicate IDs if a product is both trigger and reward
            const allProductIds = Array.from(new Set([...data.buyProductIds, ...data.getProductIds]));

            for (const productId of allProductIds) {
                const isTrigger = data.buyProductIds.includes(productId);
                const isReward = data.getProductIds.includes(productId);

                if (isTrigger || isReward) {
                    await tx.bOGOProduct.create({
                        data: {
                            bogoId: bogo.id,
                            productId,
                            isTrigger,
                            isReward
                        }
                    });
                }
            }

            return bogo;
        });

        revalidatePath('/admin/promos');
        return { success: true, data: result };

    } catch (error) {
        console.error('Failed to create BOGO deal:', error);
        return { success: false, error: 'Failed to create deal' };
    }
}

export async function toggleBOGOStatus(id: string) {
    await requireAdmin();
    try {
        const deal = await prisma.bOGODeal.findUnique({ where: { id } });
        if (!deal) return { success: false, error: 'Deal not found' };

        await prisma.bOGODeal.update({
            where: { id },
            data: { isActive: !deal.isActive }
        });

        revalidatePath('/admin/promos');
        return { success: true, isActive: !deal.isActive };
    } catch {
        return { success: false, error: 'Failed to update status' };
    }
}

export async function deleteBOGO(id: string) {
    await requireAdmin();
    try {
        await prisma.bOGODeal.delete({ where: { id } });
        revalidatePath('/admin/promos');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete BOGO deal:', error);
        return { success: false, error: 'Failed to delete BOGO deal' };
    }
}


// ==========================================
// Bundle Actions
// ==========================================

export type BundleInput = {
    name: string;
    description?: string;
    originalPrice: number; // Sum of individual product prices
    bundlePrice: number; // The special bundle price
    startDate: string;
    endDate?: string;
    isActive: boolean;
    showOnHomepage: boolean;
    productIds: string[]; // Products included in the bundle
};

export type BundleWithStats = {
    id: string;
    name: string;
    description: string | null;
    originalPrice: number;
    bundlePrice: number;
    startDate: Date;
    endDate: Date | null;
    isActive: boolean;
    showOnHomepage: boolean;
    productCount: number;
    soldCount: number;
    revenue: number;
    status: 'active' | 'scheduled' | 'expired' | 'inactive';
};

export async function getBundles(status?: string) {
    await requireAdmin();

    const now = new Date();

    const bundles = await prisma.bundle.findMany({
        where: status === 'active' ? {
            isActive: true,
            startDate: { lte: now },
            OR: [{ endDate: null }, { endDate: { gt: now } }]
        } : status === 'scheduled' ? {
            isActive: true,
            startDate: { gt: now }
        } : status === 'expired' ? {
            endDate: { lte: now }
        } : status === 'inactive' ? {
            isActive: false
        } : undefined,
        include: {
            _count: {
                select: { products: true }
            }
        },
        orderBy: { startDate: 'desc' }
    });

    return bundles.map(bundle => {
        const isExpired = bundle.endDate ? bundle.endDate <= now : false;
        const isScheduled = bundle.startDate > now;
        
        let calculatedStatus: BundleWithStats['status'] = 'inactive';
        if (bundle.isActive) {
            if (isExpired) calculatedStatus = 'expired';
            else if (isScheduled) calculatedStatus = 'scheduled';
            else calculatedStatus = 'active';
        }

        return {
            id: bundle.id,
            name: bundle.name,
            description: bundle.description,
            originalPrice: Number(bundle.originalPrice),
            bundlePrice: Number(bundle.bundlePrice),
            startDate: bundle.startDate,
            endDate: bundle.endDate,
            isActive: bundle.isActive,
            showOnHomepage: bundle.showOnHomepage,
            productCount: bundle._count.products,
            soldCount: bundle.currentSales,
            revenue: Number(bundle.bundlePrice) * bundle.currentSales,
            status: calculatedStatus
        };
    });
}

export async function createBundle(data: BundleInput) {
    await requireAdmin();

    try {
        const start = new Date(data.startDate);
        const end = data.endDate ? new Date(data.endDate) : null;

        if (end && end <= start) {
            return { success: false, error: 'End date must be after start date' };
        }

        if (data.productIds.length < 2) {
            return { success: false, error: 'A bundle must contain at least 2 products' };
        }

        const result = await prisma.$transaction(async (tx) => {
            const bundle = await tx.bundle.create({
                data: {
                    name: data.name,
                    description: data.description,
                    originalPrice: data.originalPrice,
                    bundlePrice: data.bundlePrice,
                    startDate: start,
                    endDate: end,
                    isActive: data.isActive,
                    showOnHomepage: data.showOnHomepage
                }
            });

            // Add products to bundle
            for (const productId of data.productIds) {
                await tx.bundleProduct.create({
                    data: {
                        bundleId: bundle.id,
                        productId: productId,
                        quantity: 1 // For now assume 1 of each, can be enhanced later
                    }
                });
            }

            return bundle;
        });

        revalidatePath('/admin/promos');
        return { success: true, data: result };

    } catch (error) {
        console.error('Failed to create bundle:', error);
        return { success: false, error: 'Failed to create bundle' };
    }
}

export async function toggleBundleStatus(id: string) {
    await requireAdmin();
    try {
        const bundle = await prisma.bundle.findUnique({ where: { id } });
        if (!bundle) return { success: false, error: 'Bundle not found' };

        await prisma.bundle.update({
            where: { id },
            data: { isActive: !bundle.isActive }
        });

        revalidatePath('/admin/promos');
        return { success: true, isActive: !bundle.isActive };
    } catch {
        return { success: false, error: 'Failed to update status' };
    }
}

export async function deleteBundle(id: string) {
    await requireAdmin();
    try {
        await prisma.bundle.delete({ where: { id } });
        revalidatePath('/admin/promos');
        return { success: true };
    } catch {
        return { success: false, error: 'Failed to delete bundle' };
    }
}

// ==========================================
// Product Offer Actions
// ==========================================

export type ProductOfferInput = {
    name: string;
    description?: string;
    offerType: 'PRODUCT' | 'CATEGORY' | 'BRAND' | 'ALL_PRODUCTS';
    targetId?: string; // ProductID, CategoryID, or Brand Name
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    minQuantity: number;
    maxDiscount?: number;
    startDate: string;
    endDate?: string;
    isActive: boolean;
    priority: number;
};

export type ProductOfferWithStats = {
    id: string;
    name: string;
    description: string | null;
    offerType: string;
    targetId: string | null;
    discountType: string;
    discountValue: number;
    startDate: Date;
    endDate: Date | null;
    isActive: boolean;
    priority: number;
    status: 'active' | 'scheduled' | 'expired' | 'inactive';
    targetName?: string; // Resolved name of product/category
};

export async function getProductOffers(status?: string) {
    await requireAdmin();

    const now = new Date();

    const offers = await prisma.productOffer.findMany({
        where: status === 'active' ? {
            isActive: true,
            startDate: { lte: now },
            OR: [{ endDate: null }, { endDate: { gt: now } }]
        } : status === 'scheduled' ? {
            isActive: true,
            startDate: { gt: now }
        } : status === 'expired' ? {
            endDate: { lte: now }
        } : status === 'inactive' ? {
            isActive: false
        } : undefined,
        orderBy: [{ priority: 'desc' }, { startDate: 'desc' }]
    });

    // Resolve target names
    const enrichedOffers = await Promise.all(offers.map(async (offer) => {
        const isExpired = offer.endDate ? offer.endDate <= now : false;
        const isScheduled = offer.startDate > now;
        
        let calculatedStatus: ProductOfferWithStats['status'] = 'inactive';
        if (offer.isActive) {
            if (isExpired) calculatedStatus = 'expired';
            else if (isScheduled) calculatedStatus = 'scheduled';
            else calculatedStatus = 'active';
        }

        let targetName = 'All Products';
        if (offer.offerType === 'PRODUCT' && offer.targetId) {
            const p = await prisma.product.findUnique({ where: { id: offer.targetId }, select: { name: true } });
            targetName = p?.name || 'Unknown Product';
        } else if (offer.offerType === 'CATEGORY' && offer.targetId) {
            const c = await prisma.category.findUnique({ where: { id: offer.targetId }, select: { name: true } });
            targetName = c?.name || 'Unknown Category';
        } else if (offer.offerType === 'BRAND' && offer.targetId) {
            targetName = offer.targetId;
        }

        return {
            id: offer.id,
            name: offer.name,
            description: offer.description,
            offerType: offer.offerType,
            targetId: offer.targetId,
            discountType: offer.discountType,
            discountValue: Number(offer.discountValue),
            startDate: offer.startDate,
            endDate: offer.endDate,
            isActive: offer.isActive,
            priority: offer.priority,
            status: calculatedStatus,
            targetName
        };
    }));

    return enrichedOffers;
}

export async function createProductOffer(data: ProductOfferInput) {
    await requireAdmin();

    try {
        const start = new Date(data.startDate);
        const end = data.endDate ? new Date(data.endDate) : null;

        if (end && end <= start) {
            return { success: false, error: 'End date must be after start date' };
        }

        if (data.offerType !== 'ALL_PRODUCTS' && !data.targetId) {
            return { success: false, error: 'Target is required for this offer type' };
        }

        const offer = await prisma.productOffer.create({
            data: {
                name: data.name,
                description: data.description,
                offerType: data.offerType,
                targetId: data.targetId,
                discountType: data.discountType,
                discountValue: data.discountValue,
                minQuantity: data.minQuantity,
                maxDiscount: data.maxDiscount,
                startDate: start,
                endDate: end,
                isActive: data.isActive,
                priority: data.priority
            }
        });

        revalidatePath('/admin/promos');
        return { success: true, data: offer };

    } catch (error) {
        console.error('Failed to create offer:', error);
        return { success: false, error: 'Failed to create offer' };
    }
}

export async function toggleProductOfferStatus(id: string) {
    await requireAdmin();
    try {
        const offer = await prisma.productOffer.findUnique({ where: { id } });
        if (!offer) return { success: false, error: 'Offer not found' };

        await prisma.productOffer.update({
            where: { id },
            data: { isActive: !offer.isActive }
        });

        revalidatePath('/admin/promos');
        return { success: true, isActive: !offer.isActive };
    } catch {
        return { success: false, error: 'Failed to update status' };
    }
}

export async function deleteProductOffer(id: string) {
    await requireAdmin();
    try {
        await prisma.productOffer.delete({ where: { id } });
        revalidatePath('/admin/promos');
        return { success: true };
    } catch {
        return { success: false, error: 'Failed to delete offer' };
    }
}

export async function searchCategories(query: string) {
    await requireAdmin();
    const categories = await prisma.category.findMany({
        where: {
            name: { contains: query } 
        },
        take: 5,
        select: { id: true, name: true }
    });
    return categories;
}
