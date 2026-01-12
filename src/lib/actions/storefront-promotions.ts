'use server';

import prisma from '@/lib/prisma';

export async function getPublicFlashSales() {
    const now = new Date();

    const flashSales = await prisma.flashSale.findMany({
        where: {
            isActive: true,
            showOnHomepage: true,
            startDate: { lte: now },
            endDate: { gt: now }
        },
        include: {
            products: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            imageUrl: true,
                            variants: {
                                take: 1,
                                select: { price: true }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { startDate: 'asc' }
    });

    return flashSales.map(sale => ({
        id: sale.id,
        name: sale.name,
        discountType: sale.discountType,
        discountValue: Number(sale.discountValue),
        endDate: sale.endDate,
        products: sale.products.map(p => ({
            id: p.product.id,
            name: p.product.name,
            image: p.product.imageUrl,
            originalPrice: Number(p.product.variants[0]?.price || 0),
            salePrice: Number(p.salePrice)
        }))
    }));
}


export async function getPublicFlashSaleById(id: string) {
    const now = new Date();

    const sale = await prisma.flashSale.findUnique({
        where: { id },
        include: {
            products: {
                include: {
                    product: {
                        include: {
                            variants: {
                                include: {
                                    inventory: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!sale) return null;
    
    // Check active status
    if (!sale.isActive || sale.startDate > now || sale.endDate <= now) {
        return null;
    }

    return {
        id: sale.id,
        name: sale.name,
        description: sale.description,
        discountType: sale.discountType,
        discountValue: Number(sale.discountValue),
        startDate: sale.startDate,
        endDate: sale.endDate,
        products: sale.products.map(p => {
             const product = p.product;
             // Calculate stock
             const totalStock = product.variants.reduce((acc, v) => 
                acc + v.inventory.reduce((sum, i) => sum + i.available, 0), 0
             );
             
             // Calculate isNew
             const isNew = (new Date().getTime() - product.createdAt.getTime()) < (30 * 24 * 60 * 60 * 1000);

            return {
                id: product.id,
                name: product.name,
                image: product.imageUrl,
                originalPrice: Number(product.variants[0]?.price || 0),
                salePrice: Number(p.salePrice),
                inStock: totalStock > 0,
                isNew: isNew,
                img: product.imageUrl // Compatibility
            };
        })
    };
}

export async function getPublicBundles() {
    const now = new Date();

    const bundles = await prisma.bundle.findMany({
        where: {
            isActive: true,
            showOnHomepage: true,
            startDate: { lte: now },
            OR: [{ endDate: null }, { endDate: { gt: now } }]
        },
        include: {
            products: {
                include: {
                    product: {
                        select: {
                            name: true,
                            imageUrl: true
                        }
                    }
                }
            }
        }
    });

    return bundles.map(bundle => ({
        id: bundle.id,
        name: bundle.name,
        description: bundle.description,
        originalPrice: Number(bundle.originalPrice),
        bundlePrice: Number(bundle.bundlePrice),
        savings: Number(bundle.originalPrice) - Number(bundle.bundlePrice),
        images: bundle.products.map(p => p.product.imageUrl).filter(Boolean) as string[],
        endDate: bundle.endDate
    }));
}
