import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/auth/messages
 * Contact form messages
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const [messages, total] = await Promise.all([
            prisma.contactMessage.findMany({
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.contactMessage.count(),
        ]);

        return NextResponse.json({ messages, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Mobile Messages Error:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
