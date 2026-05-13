import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

export async function GET() {
    try {
        const brands = await prisma.brand.findMany({
            include: { _count: { select: { products: true } } },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
        });
        return NextResponse.json({ brands });
    } catch (error) {
        console.error('Brands GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, nameAr, slug, imageUrl } = body;
        if (!name || !slug) return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });

        const existing = await prisma.brand.findUnique({ where: { slug } });
        if (existing) return NextResponse.json({ error: 'Brand slug already exists' }, { status: 400 });

        const brand = await prisma.brand.create({ data: { name, nameAr, slug, imageUrl } });
        return NextResponse.json({ brand, message: 'Brand created' });
    } catch (error) {
        console.error('Brand Create Error:', error);
        return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
    }
}
