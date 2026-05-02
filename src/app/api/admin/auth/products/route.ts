import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/auth/products
 * List products with search, filter by status/category, pagination
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const categoryId = searchParams.get('categoryId');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (status && status !== 'all') where.status = status;
        if (categoryId) where.categoryId = categoryId;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { nameAr: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    nameAr: true,
                    imageUrl: true,
                    status: true,
                    category: true,
                    categoryId: true,
                    createdAt: true,
                    variants: {
                        select: { id: true, sku: true, price: true },
                        take: 1,
                    },
                    _count: { select: { variants: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        return NextResponse.json({
            products: products.map(p => ({
                ...p,
                price: p.variants[0]?.price?.toNumber() || 0,
                variantCount: p._count.variants,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Mobile Products List Error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
