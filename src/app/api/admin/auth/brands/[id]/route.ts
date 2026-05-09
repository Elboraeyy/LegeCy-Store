import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const data: Record<string, unknown> = {};
        if (body.name !== undefined) data.name = body.name;
        if (body.nameAr !== undefined) data.nameAr = body.nameAr;
        if (body.slug !== undefined) data.slug = body.slug;
        if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
        const brand = await prisma.brand.update({ where: { id }, data });
        return NextResponse.json({ brand, message: 'Brand updated' });
    } catch (error) {
        console.error('Brand Update Error:', error);
        return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const brand = await prisma.brand.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
        if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        if (brand._count.products > 0) return NextResponse.json({ error: `Brand has ${brand._count.products} products. Remove products first.` }, { status: 400 });
        await prisma.brand.delete({ where: { id } });
        return NextResponse.json({ message: 'Brand deleted' });
    } catch (error) {
        console.error('Brand Delete Error:', error);
        return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
    }
}
