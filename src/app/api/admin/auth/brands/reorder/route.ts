import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { items } = body;

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: 'Expected an array of items' }, { status: 400 });
        }

        await prisma.$transaction(
            items.map((item: { id: string; sortOrder: number }) =>
                prisma.brand.update({
                    where: { id: item.id },
                    data: { sortOrder: item.sortOrder },
                })
            )
        );

        return NextResponse.json({ message: 'Brands reordered successfully' });
    } catch (error) {
        console.error('Brands Reorder Error:', error);
        return NextResponse.json({ error: 'Failed to reorder brands' }, { status: 500 });
    }
}
