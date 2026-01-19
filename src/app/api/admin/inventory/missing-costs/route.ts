import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Find all variants without cost prices
        const variantsWithoutCost = await prisma.variant.findMany({
            where: {
                OR: [
                    { costPrice: null },
                    { costPrice: 0 }
                ]
            },
            include: {
                product: {
                    select: { name: true, status: true }
                },
                inventory: {
                    select: { available: true }
                }
            },
            orderBy: [
                { createdAt: 'desc' }
            ]
        });

        const variants = variantsWithoutCost.map(v => {
            const totalStock = v.inventory.reduce((sum: number, inv: { available: number }) => sum + inv.available, 0);
            const productActive = v.product?.status === 'active';
            return {
                id: v.id,
                sku: v.sku,
                productName: v.product?.name || 'Unknown',
                productActive,
                price: Number(v.price),
                costPrice: v.costPrice ? Number(v.costPrice) : null,
                totalStock,
                createdAt: v.createdAt.toISOString()
            };
        });

        // Group by active/inactive products
        const activeProducts = variants.filter(v => v.productActive);
        const inactiveProducts = variants.filter(v => !v.productActive);

        return NextResponse.json({
            total: variants.length,
            activeProducts: activeProducts.length,
            inactiveProducts: inactiveProducts.length,
            variants: variants.slice(0, 100) // Limit to 100
        });
    } catch (error) {
        logger.error('Failed to fetch variants without cost', { error });
        return NextResponse.json(
            { error: 'Failed to fetch variants without cost' },
            { status: 500 }
        );
    }
}
