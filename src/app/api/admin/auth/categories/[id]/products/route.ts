import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
const prisma = prismaClient!;

/**
 * GET /api/admin/auth/categories/[id]/products
 * Get all products in a category with their sort order
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const category = await prisma.category.findUnique({
            where: { id },
            select: { id: true, name: true, useCustomOrder: true },
        });
        if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

        const products = await prisma.product.findMany({
            where: { categoryId: id },
            select: {
                id: true,
                name: true,
                imageUrl: true,
                status: true,
                sortInCategory: true,
                variants: {
                    select: { price: true, sku: true, inventory: { select: { available: true } } },
                    take: 1,
                },
            },
            orderBy: { sortInCategory: 'asc' },
        });

        const mapped = products.map(p => ({
            ...p,
            price: p.variants[0]?.price?.toNumber() || 0,
            sku: p.variants[0]?.sku || '',
            stock: p.variants.reduce((s, v) => s + v.inventory.reduce((a, i) => a + i.available, 0), 0),
        }));

        return NextResponse.json({ entity: category, products: mapped });
    } catch (error) {
        console.error('Category Products Error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/auth/categories/[id]/products
 * Reorder products in a category and toggle custom order mode
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { items, useCustomOrder } = body;

        // Update order mode if provided
        if (useCustomOrder !== undefined) {
            await prisma.category.update({
                where: { id },
                data: { useCustomOrder: Boolean(useCustomOrder) },
            });
        }

        // Update product sort orders if provided
        if (Array.isArray(items) && items.length > 0) {
            await prisma.$transaction(
                items.map((item: { id: string; sortOrder: number }) =>
                    prisma.product.update({
                        where: { id: item.id },
                        data: { sortInCategory: item.sortOrder },
                    })
                )
            );
        }

        revalidatePath('/', 'layout');
        revalidatePath('/shop');

        return NextResponse.json({ message: 'Products reordered successfully' });
    } catch (error) {
        console.error('Category Products Reorder Error:', error);
        return NextResponse.json({ error: 'Failed to reorder products' }, { status: 500 });
    }
}
