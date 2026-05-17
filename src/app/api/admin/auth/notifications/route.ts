import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/auth/notifications
 * Fetch all admin notifications
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const notifications = await prisma.adminNotification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error('Notifications Error:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

/**
 * POST /api/admin/auth/notifications
 * Create a new notification (used by backend triggers)
 */
export async function POST(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { title, body: notifBody, category, referenceId, referenceType } = body;

        const notification = await prisma.adminNotification.create({
            data: {
                title,
                body: notifBody,
                category: category || 'system',
                referenceId,
                referenceType,
            },
        });

        return NextResponse.json({ notification }, { status: 201 });
    } catch (error) {
        console.error('Create Notification Error:', error);
        return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/auth/notifications
 * Clear all notifications (when ?action=clear)
 */
export async function DELETE(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        await prisma.adminNotification.deleteMany({});
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Clear Notifications Error:', error);
        return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 });
    }
}
