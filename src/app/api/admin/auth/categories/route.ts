import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/auth/categories
 * List all categories
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const categories = await prisma.category.findMany({
            select: {
                id: true,
                name: true,
                nameAr: true,
                slug: true,
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({ categories });
    } catch (error) {
        console.error('Mobile Categories List Error:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
