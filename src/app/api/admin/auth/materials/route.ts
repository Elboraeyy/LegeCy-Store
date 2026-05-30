import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
const prisma = prismaClient!;

export async function GET() {
    try {
        const materials = await prisma.material.findMany({
            include: { _count: { select: { products: true } } },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
        });
        return NextResponse.json({ materials });
    } catch (error) {
        console.error('Materials GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, nameAr, slug } = body;
        if (!name || !slug) return NextResponse.json({ error: 'Name and slug required' }, { status: 400 });
        const material = await prisma.material.create({ data: { name, nameAr, slug } });
        revalidatePath('/', 'layout');
        revalidatePath('/shop');
        return NextResponse.json({ material, message: 'Material created' });
    } catch (error: unknown) {
        const err = error as { code?: string };
        if (err.code === 'P2002') return NextResponse.json({ error: 'Material name/slug already exists' }, { status: 400 });
        return NextResponse.json({ error: 'Failed to create material' }, { status: 500 });
    }
}
