import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

/**
 * GET /api/admin/auth/categories
 * List all categories
 */
export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true, children: true }
                },
                parent: {
                    select: { name: true }
                }
            },
            orderBy: { sortOrder: 'asc' },
        });

        return NextResponse.json({ categories });
    } catch (error) {
        console.error('Mobile Categories List Error:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

/**
 * POST /api/admin/auth/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, nameAr, slug, description, descriptionAr, parentId, sortOrder } = body;

        if (!name || !slug) {
            return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
        }

        const existing = await prisma.category.findUnique({
            where: { slug }
        });

        if (existing) {
            return NextResponse.json({ error: 'Category with this slug already exists' }, { status: 400 });
        }

        const category = await prisma.category.create({
            data: {
                name,
                nameAr,
                slug,
                description,
                descriptionAr,
                parentId: parentId || null,
                sortOrder: sortOrder ? Number(sortOrder) : 0,
            }
        });

        return NextResponse.json({ category, message: 'Category created successfully' });
    } catch (error) {
        console.error('Category Create Error:', error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}
