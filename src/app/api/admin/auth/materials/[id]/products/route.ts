import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const material = await prisma.material.findUnique({
            where: { id },
            select: { id: true, name: true, useCustomOrder: true },
        });
        if (!material) return NextResponse.json({ error: 'Material not found' }, { status: 404 });

        const products = await prisma.product.findMany({
            where: { materialId: id },
            select: {
                id: true,
                name: true,
                imageUrl: true,
                status: true,
                sortInMaterial: true,
                variants: {
                    select: { price: true, sku: true, inventory: { select: { available: true } } },
                    take: 1,
                },
            },
            orderBy: { sortInMaterial: 'asc' },
        });

        const mapped = products.map(p => ({
            ...p,
            price: p.variants[0]?.price?.toNumber() || 0,
            sku: p.variants[0]?.sku || '',
            stock: p.variants.reduce((s, v) => s + v.inventory.reduce((a, i) => a + i.available, 0), 0),
        }));

        return NextResponse.json({ entity: material, products: mapped });
    } catch (error) {
        console.error('Material Products Error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { items, useCustomOrder } = body;

        if (useCustomOrder !== undefined) {
            await prisma.material.update({
                where: { id },
                data: { useCustomOrder: Boolean(useCustomOrder) },
            });
        }

        if (Array.isArray(items) && items.length > 0) {
            await prisma.$transaction(
                items.map((item: { id: string; sortOrder: number }) =>
                    prisma.product.update({
                        where: { id: item.id },
                        data: { sortInMaterial: item.sortOrder },
                    })
                )
            );
        }

        return NextResponse.json({ message: 'Products reordered successfully' });
    } catch (error) {
        console.error('Material Products Reorder Error:', error);
        return NextResponse.json({ error: 'Failed to reorder products' }, { status: 500 });
    }
}
