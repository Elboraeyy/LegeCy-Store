import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: Request) {
    try {
        const { requireAdminPermission } = await import('@/lib/auth/guards');
        const { AdminPermissions } = await import('@/lib/auth/permissions');

        // Strict Check: Only Super Admins (ALL) can view audit logs
        await requireAdminPermission(AdminPermissions.ALL);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const [total, logs] = await prisma.$transaction([
            prisma.auditLog.count(),
            prisma.auditLog.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    admin: {
                        select: { name: true, email: true }
                    }
                }
            })
        ]);

        return NextResponse.json({
            data: logs,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        return handleApiError(error);
    }
}
