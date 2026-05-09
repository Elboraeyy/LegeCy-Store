import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const deals = await prisma.bOGODeal.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                products: {
                    include: { product: { select: { name: true, imageUrl: true } } }
                }
            }
        });
        return NextResponse.json({ deals });
    } catch (error) {
        console.error('BOGO Deals GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch BOGO deals' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { name, description, buyQuantity, getQuantity, discountPercent, mixAndMatch, endDate, productIds } = body;

        const deal = await prisma.bOGODeal.create({
            data: {
                name,
                description,
                buyQuantity: parseInt(buyQuantity) || 1,
                getQuantity: parseInt(getQuantity) || 1,
                discountPercent: parseInt(discountPercent) || 100,
                mixAndMatch: Boolean(mixAndMatch),
                endDate: endDate ? new Date(endDate) : null,
                products: {
                    create: (productIds || []).map((id: string) => ({
                        productId: id,
                        isTrigger: true,
                        isReward: true
                    }))
                }
            },
            include: { products: true }
        });

        return NextResponse.json({ deal, message: 'BOGO deal created successfully' }, { status: 201 });
    } catch (error) {
        console.error('BOGO Deals POST Error:', error);
        return NextResponse.json({ error: 'Failed to create BOGO deal' }, { status: 500 });
    }
}
