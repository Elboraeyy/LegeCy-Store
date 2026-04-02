/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import prisma from '@/lib/prisma';

export function getLowStockThreshold(specs: any): number {
    if (!specs) return 3;
    
    // Attempt to parse if it's a JSON string, though Prisma usually returns an object for JSON fields
    let parsedSpecs = specs;
    if (typeof specs === 'string') {
        try {
            parsedSpecs = JSON.parse(specs);
        } catch {
            return 3;
        }
    }

    if (parsedSpecs && typeof parsedSpecs.lowStockThreshold === 'number') {
        return parsedSpecs.lowStockThreshold;
    }

    // Try parsing if it was saved as string
    if (parsedSpecs && typeof parsedSpecs.lowStockThreshold === 'string') {
        const val = parseInt(parsedSpecs.lowStockThreshold, 10);
        if (!isNaN(val)) return val;
    }

    return 3; // The default requested by the user
}

export async function getLowStockProductsCount(): Promise<number> {
    try {
        const products = await prisma.product.findMany({
            where: { status: { not: 'archived' } },
            select: {
                specs: true,
                variants: {
                    select: {
                        inventory: { select: { available: true } }
                    }
                }
            }
        });

        let lowStockCount = 0;
        for (const p of products) {
            const threshold = getLowStockThreshold(p.specs);
            let productStock = 0;
            for (const v of p.variants) {
                for (const inv of v.inventory) {
                    productStock += inv.available;
                }
            }
            if (productStock > 0 && productStock <= threshold) {
                lowStockCount++;
            }
        }
        return lowStockCount;
    } catch (error) {
        console.error('Failed to get low stock count', error);
        return 0;
    }
}
