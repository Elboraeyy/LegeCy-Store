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
                        select: { 
                            id: true, 
                            sku: true, 
                            price: true,
                            inventory: { select: { available: true } }
                        },
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
            products: products.map(p => {
                const variantsWithStock = p.variants.map(v => ({
                    ...v,
                    stockQuantity: v.inventory?.reduce((sum: number, inv: { available: number }) => sum + inv.available, 0) || 0
                }));
                return {
                    ...p,
                    variants: variantsWithStock,
                    price: variantsWithStock[0]?.price?.toNumber() || 0,
                    variantCount: p._count.variants,
                    totalStock: variantsWithStock.reduce((sum, v) => sum + v.stockQuantity, 0),
                };
            }),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Mobile Products List Error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

/**
 * POST /api/admin/auth/products
 * Create a new product (basic info)
 */
export async function POST(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { name, nameAr, description, descriptionAr, categoryId, status, price, sku } = body;

        if (!name || !categoryId || !sku || price === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const product = await prisma.product.create({
            data: {
                name,
                nameAr,
                description,
                descriptionAr,
                categoryId,
                status: status || 'draft',
                slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6),
                variants: {
                    create: {
                        sku,
                        price,
                    }
                }
            },
        });

        return NextResponse.json({ success: true, product });
    } catch (error) {
        console.error('Mobile Product Create Error:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
