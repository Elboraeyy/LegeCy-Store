import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const offers = await prisma.productOffer.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ offers });
    } catch (error) {
        console.error('Offers GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { name, description, offerType, targetId, discountType, discountValue, minQuantity, maxDiscount, startDate, endDate, priority } = body;

        const offer = await prisma.productOffer.create({
            data: {
                name,
                description,
                offerType: offerType || 'GLOBAL',
                targetId,
                discountType: discountType || 'PERCENTAGE',
                discountValue: parseFloat(discountValue),
                minQuantity: minQuantity ? parseInt(minQuantity) : 1,
                maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
                startDate: new Date(startDate || Date.now()),
                endDate: endDate ? new Date(endDate) : null,
                priority: priority ? parseInt(priority) : 0,
            }
        });

        return NextResponse.json({ offer, message: 'Offer created successfully' }, { status: 201 });
    } catch (error) {
        console.error('Offers POST Error:', error);
        return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
    }
}
