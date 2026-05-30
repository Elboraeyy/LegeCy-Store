import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

const prisma = prismaClient!;

/**
 * PUT /api/admin/auth/fcm-token
 * Body: { fcmToken: string }
 * Updates the FCM token for the currently logged-in AdminUser.
 */
export async function PUT(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { fcmToken } = body;

        if (!fcmToken || typeof fcmToken !== 'string') {
            return NextResponse.json(
                { error: 'Valid FCM token is required' },
                { status: 400 }
            );
        }

        // Update the admin user's FCM token
        await prisma.adminUser.update({
            where: { id: admin.id },
            data: { fcmToken },
        });

        return NextResponse.json({ success: true, message: 'FCM token updated successfully' });
    } catch (error) {
        console.error('FCM Token Update Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
