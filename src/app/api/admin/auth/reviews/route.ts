import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/auth/reviews
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                include: {
                    product: { select: { name: true, imageUrl: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.review.count(),
        ]);

        // Map to consistent shape for mobile
        const mapped = reviews.map(r => ({
            id: r.id,
            rating: r.rating,
            comment: r.text,
            reviewerName: r.name,
            productName: r.product?.name || '-',
            productImage: r.product?.imageUrl,
            featured: r.featured,
            images: r.images,
            createdAt: r.createdAt,
        }));

        return NextResponse.json({ reviews: mapped, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Mobile Reviews Error:', error);
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
}
