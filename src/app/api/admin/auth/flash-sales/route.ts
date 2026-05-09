import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const sales = await prisma.flashSale.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                products: {
                    include: { product: { select: { name: true, imageUrl: true } } }
                }
            }
        });
        return NextResponse.json({ sales });
    } catch (error) {
        console.error('Flash Sales GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch flash sales' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { name, description, discountValue, discountType, startDate, endDate, maxQuantity } = body;

        const sale = await prisma.flashSale.create({
            data: {
                name,
                description,
                discountValue: parseFloat(discountValue),
                discountType: discountType || 'PERCENTAGE',
                startDate: new Date(startDate || Date.now()),
                endDate: new Date(endDate || Date.now() + 86400000), // Default +1 day
                maxQuantity: maxQuantity ? parseInt(maxQuantity) : null,
            }
        });

        return NextResponse.json({ sale, message: 'Flash sale created successfully' }, { status: 201 });
    } catch (error) {
        console.error('Flash Sales POST Error:', error);
        return NextResponse.json({ error: 'Failed to create flash sale' }, { status: 500 });
    }
}
