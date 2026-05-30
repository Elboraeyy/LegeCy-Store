import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
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
                prisma.material.update({
                    where: { id: item.id },
                    data: { sortOrder: item.sortOrder },
                })
            )
        );

        revalidatePath('/', 'layout');
        revalidatePath('/shop');

        return NextResponse.json({ message: 'Materials reordered successfully' });
    } catch (error) {
        console.error('Materials Reorder Error:', error);
        return NextResponse.json({ error: 'Failed to reorder materials' }, { status: 500 });
    }
}
