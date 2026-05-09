import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const includeInactive = url.searchParams.get('includeInactive') === 'true';

        const where = includeInactive ? {} : { isActive: true };

        const staff = await prisma.adminUser.findMany({
            where,
            include: {
                role: { select: { id: true, name: true, description: true } },
                _count: { select: { auditLogs: true, orderNotes: true } }
            },
            orderBy: { name: 'asc' }
        });

        const roles = await prisma.adminRole.findMany({
            include: { _count: { select: { admins: true } } },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({
            staff: staff.map(s => ({
                id: s.id,
                name: s.name,
                email: s.email,
                username: s.username,
                phone: s.phone,
                position: s.position,
                avatar: s.avatar,
                isActive: s.isActive,
                role: s.role ? { id: s.role.id, name: s.role.name } : null,
                lastLoginAt: s.lastLoginAt?.toISOString(),
                hireDate: s.hireDate?.toISOString(),
                actionsCount: s._count.auditLogs,
                notesCount: s._count.orderNotes,
            })),
            roles: roles.map(r => ({
                id: r.id,
                name: r.name,
                description: r.description,
                permissions: r.permissions,
                memberCount: r._count.admins,
            }))
        });
    } catch (error) {
        console.error('Staff GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
    }
}
