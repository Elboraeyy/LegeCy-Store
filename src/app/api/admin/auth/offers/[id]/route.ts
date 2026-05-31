import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await params;
        await prisma.productOffer.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Delete Offer Error:', error);
        return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await params;
        const body = await request.json();
        const { name, description, offerType, targetId, discountType, discountValue, minQuantity, maxDiscount, startDate, endDate, priority, isActive } = body;

        const updateData: Prisma.ProductOfferUpdateInput = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (offerType !== undefined) updateData.offerType = offerType;
        if (targetId !== undefined) updateData.targetId = targetId;
        if (discountType !== undefined) updateData.discountType = discountType;
        if (discountValue !== undefined) updateData.discountValue = parseFloat(discountValue);
        if (minQuantity !== undefined) updateData.minQuantity = parseInt(minQuantity);
        if (maxDiscount !== undefined) updateData.maxDiscount = parseFloat(maxDiscount);
        if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : new Date();
        if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
        if (priority !== undefined) updateData.priority = parseInt(priority);
        if (isActive !== undefined) updateData.isActive = isActive;

        const updated = await prisma.productOffer.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ message: 'Offer updated successfully', offer: updated });
    } catch (error) {
        console.error('Update Offer Error:', error);
        return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 });
    }
}
