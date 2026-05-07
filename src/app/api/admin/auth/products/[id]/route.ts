import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

export async function PUT(request: NextRequest, context: any) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const params = await context.params;
        const { id } = params;
        const body = await request.json();
        const { name, nameAr, description, descriptionAr, categoryId, status, price, sku, imageUrl } = body;

        const product = await prisma.product.update({
            where: { id },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(nameAr !== undefined ? { nameAr } : {}),
                ...(description !== undefined ? { description } : {}),
                ...(descriptionAr !== undefined ? { descriptionAr } : {}),
                ...(categoryId !== undefined ? { categoryId } : {}),
                ...(status !== undefined ? { status } : {}),
                ...(imageUrl !== undefined ? { imageUrl } : {}),
            },
            include: { variants: true }
        });

        // Update the first variant's price/sku if provided (for simple products)
        if (product.variants.length > 0 && (price !== undefined || sku !== undefined)) {
            await prisma.variant.update({
                where: { id: product.variants[0].id },
                data: {
                    ...(price !== undefined ? { price } : {}),
                    ...(sku !== undefined ? { sku } : {}),
                }
            });
        }

        return NextResponse.json({ success: true, product });
    } catch (error) {
        console.error('Mobile Product Update Error:', error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: any) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const params = await context.params;
        const { id } = params;
        await prisma.product.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Mobile Product Delete Error:', error);
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
