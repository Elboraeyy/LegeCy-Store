import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
const prisma = prismaClient!;

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const data: Record<string, string> = {};
        if (body.name !== undefined) data.name = body.name;
        if (body.nameAr !== undefined) data.nameAr = body.nameAr;
        if (body.slug !== undefined) data.slug = body.slug;
        const material = await prisma.material.update({ where: { id }, data });
        revalidatePath('/', 'layout');
        revalidatePath('/shop');
        return NextResponse.json({ material, message: 'Material updated' });
    } catch {
        return NextResponse.json({ error: 'Failed to update material' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const material = await prisma.material.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
        if (!material) return NextResponse.json({ error: 'Material not found' }, { status: 404 });
        if (material._count.products > 0) return NextResponse.json({ error: `Material has ${material._count.products} products` }, { status: 400 });
        await prisma.material.delete({ where: { id } });
        revalidatePath('/', 'layout');
        revalidatePath('/shop');
        return NextResponse.json({ message: 'Material deleted' });
    } catch {
        return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
    }
}
