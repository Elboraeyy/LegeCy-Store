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
            },
            groups: {
                include: {
                    options: {
                        include: {
                            product: {
                                select: { name: true, imageUrl: true }
                            }
                        },
                        take: 1 // Just take one for preview image
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return bundles.map(bundle => {
        // Collect preview images from Fixed products OR Groups
        const fixedImages = bundle.products.map(p => p.product.imageUrl).filter(Boolean) as string[];
        const groupImages = bundle.groups.map(g => g.options[0]?.product.imageUrl).filter(Boolean) as string[];
        
        return {
            id: bundle.id,
            name: bundle.name,
            description: bundle.description,
            type: bundle.bundleType,
            slug: bundle.slug || bundle.id,
            originalPrice: Number(bundle.originalPrice),
            bundlePrice: Number(bundle.bundlePrice),
            savings: Number(bundle.originalPrice) - Number(bundle.bundlePrice),
            images: [...fixedImages, ...groupImages].slice(0, 4), // Limit to 4 for preview grid
            endDate: bundle.endDate
        };
    });
}

export async function getPublicBundleBySlug(slug: string) {
    const now = new Date();

    const bundle = await prisma.bundle.findFirst({
        where: {
            OR: [{ slug }, { id: slug }],
            isActive: true
        },
        include: {
            products: {
                include: {
                    product: {
                        include: { variants: { include: { inventory: true } } }
                    }
                }
            },
            groups: {
                orderBy: { sortOrder: 'asc' },
                include: {
                    options: {
                        orderBy: { isDefault: 'desc' },
                        include: {
                            product: {
                                include: { variants: { include: { inventory: true } } }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!bundle) return null;
    
    // Check dates if strict
    if (bundle.startDate > now || (bundle.endDate && bundle.endDate <= now)) return null;

    return {
        ...bundle,
        slug: bundle.slug || bundle.id,
        originalPrice: Number(bundle.originalPrice),
        bundlePrice: Number(bundle.bundlePrice),
        savings: Number(bundle.originalPrice) - Number(bundle.bundlePrice),
        products: bundle.products.map(p => ({
            ...p,
            product: {
                ...p.product,
                price: Number(p.product.variants[0]?.price || 0),
                variants: p.product.variants.map(v => ({
                    ...v,
                    price: Number(v.price)
                }))
            }
        })),
        groups: bundle.groups.map(g => ({
            ...g,
            options: g.options.map(o => ({
                ...o,
                additionalPrice: Number(o.additionalPrice),
                product: {
                    ...o.product,
                    price: Number(o.product.variants[0]?.price || 0),
                    variants: o.product.variants.map(v => ({
                        ...v,
                        price: Number(v.price)
                    }))
                }
            }))
        }))
    };
}

export async function getPublicBOGO() {
    const now = new Date();
    
    // Valid BOGOs: Active, Started, Not Ended
    const bogos = await prisma.bOGODeal.findMany({
        where: {
            isActive: true,
            startDate: { lte: now },
            OR: [{ endDate: null }, { endDate: { gt: now } }]
        },
        include: {
            products: {
                where: { isTrigger: true }, // Only show "Buy This" products in preview
                take: 10,
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            imageUrl: true,
                            variants: { take: 1, select: { price: true } }
                        }
                    }
                }
            }
        }
    });
    
    return bogos.map(deal => ({
        id: deal.id,
        name: deal.name,
        type: deal.dealType, // BUY_X_GET_Y_FREE or DISCOUNT
        buy: deal.buyQuantity,
        get: deal.getQuantity,
        discount: deal.discountPercent,
        products: deal.products.map(p => ({
            id: p.product.id,
            name: p.product.name,
            image: p.product.imageUrl,
            price: Number(p.product.variants[0]?.price || 0)
        }))
    }));
}
