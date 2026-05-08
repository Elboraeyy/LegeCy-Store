import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

export async function POST(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { action, ids, status } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        if (action === 'delete') {
            await prisma.product.deleteMany({
                where: { id: { in: ids } }
            });
            return NextResponse.json({ success: true, message: `Deleted ${ids.length} products` });
        } else if (action === 'update_status') {
            if (!status) return NextResponse.json({ error: 'Status is required' }, { status: 400 });
            await prisma.product.updateMany({
                where: { id: { in: ids } },
                data: { status }
            });
            return NextResponse.json({ success: true, message: `Updated ${ids.length} products to ${status}` });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Mobile Bulk Product Error:', error);
        return NextResponse.json({ error: 'Failed to process bulk action' }, { status: 500 });
    }
}
