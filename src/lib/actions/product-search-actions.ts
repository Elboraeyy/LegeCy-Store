"use server";

import prisma from "@/lib/prisma";

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
    const map = new Map();
    [...products, ...productsBySku].forEach(p => map.set(p.id, p));
    return Array.from(map.values());
}

export async function searchProducts(query: string) {
    return searchAdminProducts(query);
}
