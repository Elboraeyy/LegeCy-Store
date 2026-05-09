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
        await prisma.bOGODeal.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'BOGO deal deleted successfully' });
    } catch (error) {
        console.error('Delete BOGO Error:', error);
        return NextResponse.json({ error: 'Failed to delete BOGO deal' }, { status: 500 });
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
        const { isActive } = body;

        const updated = await prisma.bOGODeal.update({
            where: { id },
            data: { isActive },
        });

        return NextResponse.json({ message: 'BOGO deal updated successfully', deal: updated });
    } catch (error) {
        console.error('Update BOGO Error:', error);
        return NextResponse.json({ error: 'Failed to update BOGO deal' }, { status: 500 });
    }
}
