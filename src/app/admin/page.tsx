import AdminHomeClient from './_components/home/AdminHomeClient';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';
import prisma from '@/lib/prisma';

// Fetch command center stats
async function getCommandCenterStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingOrders, activeAlerts, lowStockItems, todayOrders] = await Promise.all([
        // Pending orders count
        prisma.order.count({
            where: {
                status: { in: ['PENDING', 'PROCESSING'] }
            }
        }),
        // Active alerts count
        prisma.stockAlert.count({
            where: { status: 'ACTIVE' }
        }),
        // Low stock count (using where minStock > 0 and available < minStock is complex, simplify)
        prisma.$queryRaw<[{count: bigint}]>`
            SELECT COUNT(*) as count FROM "WarehouseStock" 
            WHERE available < min_stock AND min_stock > 0
        `.then(r => Number(r[0]?.count || 0)).catch(() => 0),
        // Today's revenue
        prisma.order.aggregate({
            where: {
                createdAt: { gte: today },
                status: { not: 'CANCELLED' }
            },
            _sum: { totalPrice: true }
        })
    ]);

    // Determine system status
    let systemStatus: 'nominal' | 'attention' | 'critical' = 'nominal';
    if (activeAlerts > 5 || pendingOrders > 20) systemStatus = 'critical';
    else if (activeAlerts > 0 || pendingOrders > 10) systemStatus = 'attention';

    return {
        pendingOrders,
        activeAlerts,
        lowStockCount: lowStockItems,
        todayRevenue: todayOrders._sum?.totalPrice?.toNumber() || 0,
        systemStatus
    };
}

export default async function AdminDashboard() {
    await requireAdminPermission(AdminPermissions.DASHBOARD.VIEW);

    const stats = await getCommandCenterStats();

    return <AdminHomeClient stats={stats} />;
}
