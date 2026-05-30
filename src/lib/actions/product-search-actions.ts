"use server";

import prisma from "@/lib/prisma";
import {
    getPrimaryVariant,
    getPrimaryVariantId,
    getPrimaryVariantNumber,
    getPrimaryVariantStock,
} from "@/lib/products/primary-variant";

export async function searchAdminProducts(query: string) {
    if (!query) return [];

    const products = await prisma.product.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: 'insensitive' } }
            ]
        },
        take: 20,
        select: {
            id: true,
            name: true,
            imageUrl: true,
            images: {
                take: 1,
                select: { url: true }
            },
            variants: {
                select: {
                    id: true,
                    sku: true,
                    price: true,
                    inventory: {
                        select: {
                            available: true
                        }
                    }
                }
            }
        }
    });

    // If we want to search by SKU we need relation filter
    const productsBySku = await prisma.product.findMany({
        where: {
            variants: {
                some: {
                    sku: { contains: query, mode: 'insensitive' }
                }
            }
        },
        take: 20,
        select: {
            id: true,
            name: true,
            imageUrl: true,
            images: {
                take: 1,
                select: { url: true }
            },
            variants: {
                select: {
                    id: true,
                    sku: true,
                    price: true,
                    inventory: {
                        select: {
                            available: true
                        }
                    }
                }
            }
        }
    });

    // Merge and dedup
    const map = new Map<string, (typeof products)[number]>();
    [...products, ...productsBySku].forEach(p => map.set(p.id, p));
    return Array.from(map.values()).map((product) => {
        const normalizedVariants = product.variants.map((variant) => ({
            ...variant,
            price: Number(variant.price),
            stockQuantity: variant.inventory.reduce(
                (sum, inventory) => sum + inventory.available,
                0,
            ),
        }));
        const primaryVariant = getPrimaryVariant(normalizedVariants);

        return {
            ...product,
            defaultVariantId: getPrimaryVariantId(product.variants),
            sku: primaryVariant?.sku || null,
            price: getPrimaryVariantNumber(product.variants, "price"),
            stock: getPrimaryVariantStock(product.variants),
            variants: normalizedVariants,
        };
    });
}

export async function searchProducts(query: string) {
    return searchAdminProducts(query);
}
