import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '100');
        const page = parseInt(url.searchParams.get('page') || '1');
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                include: {
                    admin: { select: { name: true, avatar: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
            }),
            prisma.auditLog.count()
        ]);

        return NextResponse.json({
            logs: logs.map(l => ({
                id: l.id,
                adminName: l.admin.name,
                adminAvatar: l.admin.avatar,
                action: l.action,
                entityType: l.entityType,
                entityId: l.entityId,
                metadata: l.metadata,
                ipAddress: l.ipAddress,
                createdAt: l.createdAt.toISOString(),
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Activity Log GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
