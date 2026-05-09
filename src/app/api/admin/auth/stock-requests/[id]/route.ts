import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

const prisma = prismaClient!;

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        const updated = await prisma.stockNotification.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json({ message: 'Request updated successfully', request: updated });
    } catch (error) {
        console.error('Update Stock Notification Error:', error);
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await params;
        
        await prisma.stockNotification.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Request deleted successfully' });
    } catch (error) {
        console.error('Delete Stock Notification Error:', error);
        return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 });
    }
}
