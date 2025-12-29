import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';
        const limit = parseInt(searchParams.get('limit') || '100');
        const warehouseId = searchParams.get('warehouseId');

        // Build where clause
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = {
            status: 'active'
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } }
            ];
        }

        if (category && category !== 'all') {
            where.category = category;
        }

        const products = await prisma.product.findMany({
            where,
            take: limit,
            include: {
                variants: {
                    include: {
                        inventory: warehouseId ? {
                            where: { warehouseId }
                        } : true
                    }
                },
                categoryRel: {
                    select: { name: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        // Transform to POS-friendly format
        const posProducts = products.flatMap(p => {
            if (p.variants.length === 0) {
                return [{
                    id: p.id,
                    productId: p.id,
                    name: p.name,
                    sku: p.id.slice(0, 8).toUpperCase(),
                    barcode: null,
                    imageUrl: p.imageUrl,
                    price: 0,
                    stock: 0,
                    category: p.categoryRel?.name || p.category || 'Uncategorized'
                }];
            }

            return p.variants.map(v => ({
                id: `${p.id}-${v.id}`,
                productId: p.id,
                variantId: v.id,
                name: p.name,
                sku: v.sku,
                barcode: null,
                imageUrl: p.imageUrl,
                price: Number(v.price),
                stock: v.inventory.reduce((sum, inv) => sum + inv.available, 0),
                category: p.categoryRel?.name || p.category || 'Uncategorized'
            }));
        });

        return NextResponse.json({ products: posProducts });
    } catch (error) {
        console.error('Error fetching POS products:', error);
        // Return demo products
        return NextResponse.json({
            products: [
                { id: '1', productId: '1', name: 'Classic Watch', sku: 'WCH-001', price: 1500, stock: 10, category: 'Watches' },
                { id: '2', productId: '2', name: 'Leather Wallet', sku: 'WLT-001', price: 450, stock: 25, category: 'Accessories' },
                { id: '3', productId: '3', name: 'Silver Ring', sku: 'RNG-001', price: 300, stock: 15, category: 'Jewelry' },
                { id: '4', productId: '4', name: 'Gold Necklace', sku: 'NCK-001', price: 2500, stock: 5, category: 'Jewelry' },
                { id: '5', productId: '5', name: 'Belt Classic', sku: 'BLT-001', price: 350, stock: 20, category: 'Accessories' },
                { id: '6', productId: '6', name: 'Cufflinks Set', sku: 'CFL-001', price: 200, stock: 30, category: 'Accessories' }
            ]
        });
    }
}
