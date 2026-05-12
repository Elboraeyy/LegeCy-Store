import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

/**
 * PUT /api/admin/auth/categories/reorder
 * Reorder categories by providing an array of objects { id, sortOrder }
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { items } = body;

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: 'Expected an array of items' }, { status: 400 });
        }

        // Perform all updates in a transaction
        await prisma.$transaction(
            items.map((item: { id: string; sortOrder: number }) =>
                prisma.category.update({
                    where: { id: item.id },
                    data: { sortOrder: item.sortOrder },
                })
            )
        );

        return NextResponse.json({ message: 'Categories reordered successfully' });
    } catch (error) {
        console.error('Categories Reorder Error:', error);
        return NextResponse.json({ error: 'Failed to reorder categories' }, { status: 500 });
    }
}
