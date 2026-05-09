import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const bundles = await prisma.bundle.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                products: {
                    include: { product: { select: { name: true, imageUrl: true } } }
                }
            }
        });
        return NextResponse.json({ bundles });
    } catch (error) {
        console.error('Bundles GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch bundles' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { name, description, bundlePrice, originalPrice, startDate, endDate, productIds } = body;

        const bundle = await prisma.bundle.create({
            data: {
                name,
                description,
                bundlePrice: parseFloat(bundlePrice),
                originalPrice: parseFloat(originalPrice),
                startDate: new Date(startDate || Date.now()),
                endDate: endDate ? new Date(endDate) : null,
                products: {
                    create: (productIds || []).map((id: string) => ({
                        productId: id,
                        quantity: 1
                    }))
                }
            },
            include: { products: true }
        });

        return NextResponse.json({ bundle, message: 'Bundle created successfully' }, { status: 201 });
    } catch (error) {
        console.error('Bundles POST Error:', error);
        return NextResponse.json({ error: 'Failed to create bundle' }, { status: 500 });
    }
}
