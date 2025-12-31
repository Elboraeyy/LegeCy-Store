'use server';

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface ShopProduct {
    id: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    category: string | null;
    imageUrl: string | null;
    images: string[];
    brand: string | null;
    material: string | null; // Added material slug
    strap: string | null;
    status: string;
    variantCount: number;
    inStock: boolean;
    defaultVariantId: string | null; // For cart operations
    isNew?: boolean;
}

export async function fetchShopProducts(): Promise<ShopProduct[]> {
    const products = await prisma.product.findMany({
        where: {
            // Only show active products on the frontend
            // status: 'active' // Uncomment when status field is available
        },
        orderBy: { createdAt: 'desc' },
        include: {
            variants: {
                include: {
                    inventory: true
                }
            },
            images: true,
            categoryRel: true,
            brand: true,
            material: true
        }
    });

    return products.map(product => {
        const mainVariant = product.variants[0];
        const totalStock = product.variants.reduce((acc, v) => 
            acc + v.inventory.reduce((sum, i) => sum + i.available, 0), 0
        );

        return {
            id: product.id,
            name: product.name,
            price: mainVariant ? Number(mainVariant.price) : 0,
            compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
            // Prioritize category relation slug, fallback to legacy string
            category: product.categoryRel?.slug || product.category,
            brand: product.brand?.slug || null,
            material: product.material?.slug || null, // Map to slug for filtering
            imageUrl: product.imageUrl,
            images: product.images.map(img => img.url),
            // Legacy fields mapped below or handled above
            strap: product.material?.name || null, // for display if needed
            status: 'active',
            variantCount: product.variants.length,
            inStock: totalStock > 0,
            defaultVariantId: mainVariant?.id || null,
            isNew: (new Date().getTime() - product.createdAt.getTime()) < (30 * 24 * 60 * 60 * 1000)
        };
    });
}

export async function fetchProductById(id: string) {
    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            variants: {
                include: {
                    inventory: true
                }
            },
            images: true
        }
    });

    if (!product) return null;

    const mainVariant = product.variants[0];
    const totalStock = product.variants.reduce((acc, v) => 
        acc + v.inventory.reduce((sum, i) => sum + i.available, 0), 0
    );

    return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: mainVariant ? Number(mainVariant.price) : 0,
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        category: product.category,
        imageUrl: product.imageUrl,
        images: product.images.map(img => img.url),
        variants: product.variants.map(v => ({
            id: v.id,
            sku: v.sku,
            price: Number(v.price),
            stock: v.inventory.reduce((sum, i) => sum + i.available, 0)
        })),
        inStock: totalStock > 0,
        totalStock,
        isNew: (new Date().getTime() - product.createdAt.getTime()) < (30 * 24 * 60 * 60 * 1000)
    };
}

export async function deleteAllProducts(): Promise<{ success: boolean; deletedCount: number }> {
    try {
        // Delete in order due to foreign key constraints
        await prisma.inventory.deleteMany({});
        await prisma.variant.deleteMany({});
        await prisma.productImage.deleteMany({});
        await prisma.product.deleteMany({});

        return { success: true, deletedCount: 0 };
    } catch (error) {
        console.error('Failed to delete products:', error);
        return { success: false, deletedCount: 0 };
    }
}

export async function fetchRelatedProducts(productId: string, category: string | null): Promise<ShopProduct[]> {
    const whereClause: Prisma.ProductWhereInput = {
        id: { not: productId },
        // status: 'active'
    };

    if (category) {
        whereClause.category = category;
    }

    const products = await prisma.product.findMany({
        where: whereClause,
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: {
            variants: {
                include: {
                    inventory: true
                }
            },
            images: true
        }
    });

    // If we don't have enough related products by category, fetch latest products
    if (products.length < 4 && category) {
        const additionalProducts = await prisma.product.findMany({
            where: {
                id: { not: productId, notIn: products.map(p => p.id) },
                // status: 'active'
            },
            take: 4 - products.length,
            orderBy: { createdAt: 'desc' },
            include: {
                variants: {
                    include: {
                        inventory: true
                    }
                },
                images: true
            }
        });
        products.push(...additionalProducts);
    }

    return products.map(product => {
        const mainVariant = product.variants[0];
        const totalStock = product.variants.reduce((acc, v) => 
            acc + v.inventory.reduce((sum, i) => sum + i.available, 0), 0
        );

        return {
            id: product.id,
            name: product.name,
            price: mainVariant ? Number(mainVariant.price) : 0,
            compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
            category: product.category,
            imageUrl: product.imageUrl,
            images: product.images.map(img => img.url),
            brand: null, 
            material: null,
            strap: null,
            status: 'active',
            variantCount: product.variants.length,
            inStock: totalStock > 0,
            defaultVariantId: mainVariant?.id || null,
            isNew: (new Date().getTime() - product.createdAt.getTime()) < (30 * 24 * 60 * 60 * 1000)
        };
    });
}

// Fetch featured products (for homepage carousel)
export async function fetchFeaturedProducts(limit: number = 8): Promise<ShopProduct[]> {
    const products = await prisma.product.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            variants: {
                include: {
                    inventory: true
                }
            },
            images: true,
            brand: true,
            material: true
        }
    });

    return products.map(product => {
        const mainVariant = product.variants[0];
        const totalStock = product.variants.reduce((acc, v) => 
            acc + v.inventory.reduce((sum, i) => sum + i.available, 0), 0
        );

        return {
            id: product.id,
            name: product.name,
            price: mainVariant ? Number(mainVariant.price) : 0,
            compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
            category: product.category,
            imageUrl: product.imageUrl,
            images: product.images.map(img => img.url),
            brand: product.brand?.slug || null,
            material: product.material?.slug || null,
            strap: product.material?.name || null,
            status: 'active',
            variantCount: product.variants.length,
            inStock: totalStock > 0,
            defaultVariantId: mainVariant?.id || null,
            isNew: (new Date().getTime() - product.createdAt.getTime()) < (30 * 24 * 60 * 60 * 1000)
        };
    });
}

// Fetch new arrivals (products created in last 30 days)
export async function fetchNewArrivals(limit: number = 8): Promise<ShopProduct[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const products = await prisma.product.findMany({
        where: {
            createdAt: { gte: thirtyDaysAgo }
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            variants: {
                include: {
                    inventory: true
                }
            },
            images: true,
            brand: true,
            material: true
        }
    });

    return products.map(product => {
        const mainVariant = product.variants[0];
        const totalStock = product.variants.reduce((acc, v) => 
            acc + v.inventory.reduce((sum, i) => sum + i.available, 0), 0
        );

        return {
            id: product.id,
            name: product.name,
            price: mainVariant ? Number(mainVariant.price) : 0,
            compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
            category: product.category,
            imageUrl: product.imageUrl,
            images: product.images.map(img => img.url),
            brand: product.brand?.slug || null,
            material: product.material?.slug || null,
            strap: product.material?.name || null,
            status: 'active',
            variantCount: product.variants.length,
            inStock: totalStock > 0,
            defaultVariantId: mainVariant?.id || null,
            isNew: true
        };
    });
}
