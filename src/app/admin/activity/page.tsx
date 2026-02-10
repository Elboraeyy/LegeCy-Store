import prisma from '@/lib/prisma';
import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import ActivityClient from './ActivityClient';

const PAGE_SIZE = 20;

export default async function ActivityLogPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    const resolvedParams = await searchParams;
    const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page) : 1;
    const actionFilter = typeof resolvedParams.action === 'string' ? resolvedParams.action : '';

    const whereClause = actionFilter ? { action: { contains: actionFilter } } : {};

    const [logs, total] = await prisma.$transaction([
        prisma.auditLog.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
            include: {
                admin: { select: { name: true, email: true } }
            }
        }),
        prisma.auditLog.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    // Serialize dates for client component
    const serializedLogs = logs.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
    }));

    return (
        <ActivityClient
            logs={serializedLogs}
            total={total}
            page={page}
            totalPages={totalPages}
            actionFilter={actionFilter}
        />
    );
}
