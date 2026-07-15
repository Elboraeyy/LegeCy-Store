import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';
import { revalidatePath } from 'next/cache';

/**
 * DELETE /api/admin/auth/reviews/[id]
 * Delete a review (Reject)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await params;
        const review = await prisma.review.findUnique({
            where: { id },
            select: { productId: true }
        });

        await prisma.review.delete({
            where: { id },
        });

        revalidatePath('/');
        revalidatePath('/shop');
        revalidatePath('/admin/reviews');
        if (review?.productId) {
            revalidatePath(`/product/${review.productId}`);
        }

        return NextResponse.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Delete Review Error:', error);
        return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/auth/reviews/[id]
 * Toggle featured status of a review (Approve/Feature)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await params;
        const body = await request.json();
        const { featured } = body;

        const updated = await prisma.review.update({
            where: { id },
            data: { featured },
        });

        revalidatePath('/');
        revalidatePath('/shop');
        revalidatePath('/admin/reviews');
        if (updated.productId) {
            revalidatePath(`/product/${updated.productId}`);
        }

        return NextResponse.json({ message: 'Review updated successfully', review: updated });
    } catch (error) {
        console.error('Update Review Error:', error);
        return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }
}
