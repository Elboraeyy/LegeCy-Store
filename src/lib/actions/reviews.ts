/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';

export interface ReviewDTO {
    id: string;
    name: string;
    rating: number;
    text: string;
    productId: string | null;
    productName?: string;
    featured: boolean;
    createdAt: Date;
}

/**
 * Fetch featured reviews for display on product pages
 */
export async function fetchFeaturedReviews(): Promise<ReviewDTO[]> {
    const reviews = await (prisma as any).review.findMany({
        where: { featured: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
            product: { select: { name: true } }
        }
    });

    return reviews.map((r: any) => ({ // Cast r to any
        id: r.id,
        name: r.name,
        rating: r.rating,
        text: r.text,
        productId: r.productId,
        productName: r.product?.name,
        featured: r.featured,
        createdAt: r.createdAt
    }));
}

/**
 * Fetch reviews for a specific product
 */
export async function fetchProductReviews(productId: string): Promise<ReviewDTO[]> {
    const reviews = await (prisma as any).review.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' }
    });

    return reviews.map((r: any) => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        text: r.text,
        productId: r.productId,
        featured: r.featured,
        createdAt: r.createdAt
    }));
}

/**
 * Fetch all reviews for admin management
 */
export async function fetchAllReviews(): Promise<ReviewDTO[]> {
    const reviews = await (prisma as any).review.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            product: { select: { name: true } }
        }
    });

    return reviews.map((r: any) => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        text: r.text,
        productId: r.productId,
        productName: r.product?.name,
        featured: r.featured,
        createdAt: r.createdAt
    }));
}

export interface CreateReviewInput {
    name: string;
    rating: number;
    text: string;
    productId?: string;
    featured?: boolean;
}

/**
 * Create a new review (Admin only)
 */
export async function createReviewAction(data: CreateReviewInput) {
    await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

    const review = await (prisma as any).review.create({
        data: {
            name: data.name,
            rating: Math.min(5, Math.max(1, data.rating)),
            text: data.text,
            productId: data.productId || null,
            featured: data.featured ?? false
        }
    });

    revalidatePath('/admin/reviews');
    return review;
}

/**
 * Update review (Admin only)
 */
export async function updateReviewAction(id: string, data: Partial<CreateReviewInput>) {
    await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

    await (prisma as any).review.update({
        where: { id },
        data: {
            name: data.name,
            rating: data.rating ? Math.min(5, Math.max(1, data.rating)) : undefined,
            text: data.text,
            productId: data.productId,
            featured: data.featured
        }
    });

    revalidatePath('/admin/reviews');
}

/**
 * Toggle featured status (Admin only)
 */
export async function toggleReviewFeaturedAction(id: string) {
    await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

    const review = await (prisma as any).review.findUnique({ where: { id } });
    if (!review) throw new Error('Review not found');

    await (prisma as any).review.update({
        where: { id },
        data: { featured: !review.featured }
    });

    revalidatePath('/admin/reviews');
}

/**
 * Delete review (Admin only)
 */
export async function deleteReviewAction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

        await (prisma as any).review.delete({ where: { id } });

        revalidatePath('/admin/reviews');
        return { success: true };
    } catch (error) {
        console.error('Delete Review Error:', error);
        return { success: false, error: 'Failed to delete review' };
    }
}

/**
 * Submit a review (Customer - no auth required)
 * Reviews are not featured by default (needs admin approval)
 */
export interface SubmitReviewInput {
    productId: string;
    name: string;
    rating: number;
    text: string;
}

export async function submitReview(data: SubmitReviewInput): Promise<{ success: boolean; error?: string }> {
    try {
        // Validate input
        if (!data.name || data.name.trim().length < 2) {
            return { success: false, error: 'Name is required' };
        }

        if (!data.text || data.text.trim().length < 10) {
            return { success: false, error: 'Review must be at least 10 characters' };
        }

        if (data.rating < 1 || data.rating > 5) {
            return { success: false, error: 'Rating must be between 1 and 5' };
        }

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: data.productId },
            select: { id: true }
        });

        if (!product) {
            return { success: false, error: 'Product not found' };
        }

        // Create review (not featured by default - needs admin approval)
        await (prisma as any).review.create({
            data: {
                name: data.name.trim(),
                text: data.text.trim(),
                rating: Math.min(5, Math.max(1, data.rating)),
                productId: data.productId,
                featured: false
            }
        });

        revalidatePath(`/product/${data.productId}`);
        return { success: true };

    } catch (error) {
        console.error('Submit Review Error:', error);
        return { success: false, error: 'Failed to submit review' };
    }
}

