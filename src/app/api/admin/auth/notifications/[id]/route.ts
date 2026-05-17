import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * PUT /api/admin/auth/notifications/[id]
 * Update a notification (mark as read)
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

        // Handle "read-all" special case
        if (id === 'read-all') {
            await prisma.adminNotification.updateMany({
                where: { isRead: false },
                data: { isRead: true },
            });
            return NextResponse.json({ success: true });
        }

        const notification = await prisma.adminNotification.update({
            where: { id },
            data: { isRead: body.isRead ?? true },
        });

        return NextResponse.json({ notification });
    } catch (error) {
        console.error('Update Notification Error:', error);
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/auth/notifications/[id]
 * Delete a single notification (or 'clear' for all)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await params;

        if (id === 'clear') {
            await prisma.adminNotification.deleteMany({});
            return NextResponse.json({ success: true });
        }

        await prisma.adminNotification.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Notification Error:', error);
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }
}
