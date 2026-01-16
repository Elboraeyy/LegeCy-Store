'use server';

import prisma from '@/lib/prisma';
import { validateCustomerSession } from '@/lib/auth/session';
import { z } from 'zod';

// Validation schemas
const updateProfileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    phone: z.string().optional().nullable()
});

const updateImageSchema = z.object({
    imageUrl: z.string().url('Invalid image URL')
});

export interface ProfileUpdateResult {
    success: boolean;
    error?: string;
    data?: {
        name: string | null;
        phone: string | null;
        image: string | null;
    };
}

/**
 * Update the current user's profile information (name, phone)
 */
export async function updateProfile(data: {
    name: string;
    phone?: string | null;
}): Promise<ProfileUpdateResult> {
    try {
        const { user } = await validateCustomerSession();

        if (!user) {
            return { success: false, error: 'You must be logged in' };
        }

        // Validate input
        const parsed = updateProfileSchema.safeParse(data);
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues[0]?.message || 'Invalid input'
            };
        }

        // Update user in database
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: parsed.data.name,
                phone: parsed.data.phone || null
            },
            select: {
                name: true,
                phone: true,
                image: true
            }
        });

        return {
            success: true,
            data: updatedUser
        };

    } catch (error) {
        console.error('Update profile error:', error);
        return { success: false, error: 'Failed to update profile' };
    }
}

/**
 * Update the current user's profile image
 */
export async function updateProfileImage(imageUrl: string): Promise<ProfileUpdateResult> {
    try {
        const { user } = await validateCustomerSession();

        if (!user) {
            return { success: false, error: 'You must be logged in' };
        }

        // Validate input
        const parsed = updateImageSchema.safeParse({ imageUrl });
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues[0]?.message || 'Invalid image URL'
            };
        }

        // Update user image in database
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                image: parsed.data.imageUrl
            },
            select: {
                name: true,
                phone: true,
                image: true
            }
        });

        return {
            success: true,
            data: updatedUser
        };

    } catch (error) {
        console.error('Update profile image error:', error);
        return { success: false, error: 'Failed to update profile image' };
    }
}

/**
 * Remove the current user's profile image
 */
export async function removeProfileImage(): Promise<ProfileUpdateResult> {
    try {
        const { user } = await validateCustomerSession();

        if (!user) {
            return { success: false, error: 'You must be logged in' };
        }

        // Remove user image in database
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                image: null
            },
            select: {
                name: true,
                phone: true,
                image: true
            }
        });

        return {
            success: true,
            data: updatedUser
        };

    } catch (error) {
        console.error('Remove profile image error:', error);
        return { success: false, error: 'Failed to remove profile image' };
    }
}

/**
 * Get current user's full profile data
 */
export async function getProfileData() {
    try {
        const { user } = await validateCustomerSession();

        if (!user) {
            return null;
        }

        const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                points: true,
                createdAt: true,
                _count: {
                    select: {
                        orders: true,
                        addresses: true
                    }
                }
            }
        });

        if (!fullUser) return null;

        return {
            ...fullUser,
            createdAt: fullUser.createdAt.toISOString(),
            orderCount: fullUser._count.orders,
            addressCount: fullUser._count.addresses
        };

    } catch (error) {
        console.error('Get profile data error:', error);
        return null;
    }
}
