import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
    const { user: adminUser, session } = await validateAdminSession();
    if (!adminUser || !session) redirect('/admin/login');

    // Get admin stats
    const [
        totalOrders,
        todayOrders,
        totalRevenue,
        activeSessions
    ] = await prisma.$transaction([
        prisma.order.count({ where: { status: { not: 'cancelled' } } }),
        prisma.order.count({
            where: {
                createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                status: { not: 'cancelled' }
            }
        }),
        prisma.order.aggregate({
            where: { status: { not: 'cancelled' } },
            _sum: { totalPrice: true, shippingCost: true }
        }),
        prisma.adminSession.count({
            where: {
                expiresAt: { gt: new Date() }
            }
        })
    ]);

    const revenueValue = totalRevenue._sum.totalPrice 
        ? ((Number(totalRevenue._sum.totalPrice) - Number(totalRevenue._sum.shippingCost || 0)) / 1000).toFixed(1) 
        : '0';

    return (
        <ProfileClient
            adminUser={adminUser}
            session={session}
            stats={{
                totalOrders,
                todayOrders,
                revenueValue,
                activeSessions
            }}
        />
    );
}
