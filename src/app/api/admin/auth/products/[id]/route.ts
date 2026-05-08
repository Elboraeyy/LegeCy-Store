import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const params = await context.params;
        const { id } = params;
        const body = await request.json();
        const { 
            name, nameAr, description, descriptionAr, categoryId, status, price, sku,
            detailedDescription, detailedDescriptionAr, compareAtPrice, costPrice,
            brandId, materialId, supplierId, showInNewArrivals, showInForYou,
            detailTags, metaTitle, metaTitleAr, metaDescription, metaDescriptionAr,
            slug, specs, imageUrl, gallery
        } = body;

        const product = await prisma.product.update({
            where: { id },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(nameAr !== undefined ? { nameAr } : {}),
                ...(description !== undefined ? { description } : {}),
                ...(descriptionAr !== undefined ? { descriptionAr } : {}),
                ...(detailedDescription !== undefined ? { detailedDescription } : {}),
                ...(detailedDescriptionAr !== undefined ? { detailedDescriptionAr } : {}),
                ...(categoryId !== undefined ? { categoryId: categoryId || null } : {}),
                ...(brandId !== undefined ? { brandId: brandId || null } : {}),
                ...(materialId !== undefined ? { materialId: materialId || null } : {}),
                ...(supplierId !== undefined ? { supplierId: supplierId || null } : {}),
                ...(status !== undefined ? { status } : {}),
                ...(compareAtPrice !== undefined ? { compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null } : {}),
                ...(costPrice !== undefined ? { costPrice: costPrice ? parseFloat(costPrice) : null } : {}),
                ...(imageUrl !== undefined ? { imageUrl } : {}),
                ...(showInNewArrivals !== undefined ? { showInNewArrivals } : {}),
                ...(showInForYou !== undefined ? { showInForYou } : {}),
                ...(detailTags !== undefined ? { detailTags } : {}),
                ...(metaTitle !== undefined ? { metaTitle } : {}),
                ...(metaTitleAr !== undefined ? { metaTitleAr } : {}),
                ...(metaDescription !== undefined ? { metaDescription } : {}),
                ...(metaDescriptionAr !== undefined ? { metaDescriptionAr } : {}),
                ...(slug !== undefined ? { slug } : {}),
                ...(specs !== undefined ? { specs } : {}),
            },
            include: { variants: true }
        });

        // Update the first variant's price/sku if provided (for simple products)
        if (product.variants.length > 0 && (price !== undefined || sku !== undefined || costPrice !== undefined)) {
            await prisma.variant.update({
                where: { id: product.variants[0].id },
                data: {
                    ...(price !== undefined ? { price: parseFloat(price) } : {}),
                    ...(sku !== undefined ? { sku } : {}),
                    ...(costPrice !== undefined ? { costPrice: costPrice ? parseFloat(costPrice) : null } : {}),
                }
            });
        }

        // Handle gallery update
        if (gallery !== undefined) {
            await prisma.productImage.deleteMany({ where: { productId: id } });
            if (gallery.length > 0) {
                await prisma.productImage.createMany({
                    data: gallery.map((url: string) => ({ url, productId: id }))
                });
            }
        }

        return NextResponse.json({ success: true, product });
    } catch (error) {
        console.error('Mobile Product Update Error:', error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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
