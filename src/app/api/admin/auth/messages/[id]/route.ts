import { NextRequest, NextResponse } from 'next/server';
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
        await prisma.contactMessage.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete Message Error:', error);
        return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
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
        const { status } = body;

        const updated = await prisma.contactMessage.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json({ message: 'Message updated successfully', messageData: updated });
    } catch (error) {
        console.error('Update Message Error:', error);
        return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }
}
