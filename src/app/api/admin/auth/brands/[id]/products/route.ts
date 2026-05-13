import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const brand = await prisma.brand.findUnique({
            where: { id },
            select: { id: true, name: true, useCustomOrder: true },
        });
        if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

        const products = await prisma.product.findMany({
            where: { brandId: id },
            select: {
                id: true,
                name: true,
                imageUrl: true,
                status: true,
                sortInBrand: true,
                variants: {
                    select: { price: true, sku: true, inventory: { select: { available: true } } },
                    take: 1,
                },
            },
            orderBy: { sortInBrand: 'asc' },
        });

        const mapped = products.map(p => ({
            ...p,
            price: p.variants[0]?.price?.toNumber() || 0,
            sku: p.variants[0]?.sku || '',
            stock: p.variants.reduce((s, v) => s + v.inventory.reduce((a, i) => a + i.available, 0), 0),
        }));

        return NextResponse.json({ entity: brand, products: mapped });
    } catch (error) {
        console.error('Brand Products Error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { items, useCustomOrder } = body;

        if (useCustomOrder !== undefined) {
            await prisma.brand.update({
                where: { id },
                data: { useCustomOrder: Boolean(useCustomOrder) },
            });
        }

        if (Array.isArray(items) && items.length > 0) {
            await prisma.$transaction(
                items.map((item: { id: string; sortOrder: number }) =>
                    prisma.product.update({
                        where: { id: item.id },
                        data: { sortInBrand: item.sortOrder },
                    })
                )
            );
        }

        return NextResponse.json({ message: 'Products reordered successfully' });
    } catch (error) {
        console.error('Brand Products Reorder Error:', error);
        return NextResponse.json({ error: 'Failed to reorder products' }, { status: 500 });
    }
}
