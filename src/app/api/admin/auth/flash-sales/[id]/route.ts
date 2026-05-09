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
        await prisma.flashSale.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Flash sale deleted successfully' });
    } catch (error) {
        console.error('Delete Flash Sale Error:', error);
        return NextResponse.json({ error: 'Failed to delete flash sale' }, { status: 500 });
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

        const updated = await prisma.flashSale.update({
            where: { id },
            data: { isActive },
        });

        return NextResponse.json({ message: 'Flash sale updated successfully', sale: updated });
    } catch (error) {
        console.error('Update Flash Sale Error:', error);
        return NextResponse.json({ error: 'Failed to update flash sale' }, { status: 500 });
    }
}
