'use server';

import prisma from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';

export interface AnalyticsData {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    salesTrend: { date: string; value: number }[];
    topProducts: { name: string; sold: number; revenue: number }[];
    lowStockCount: number;
    // New: Trend calculations
    revenueTrend: number;
    ordersTrend: number;
    customersTrend: number;
    aovTrend: number;
    // New: Orders by status
    ordersByStatus: { status: string; count: number }[];
    // New: Recent orders
    recentOrders: { id: string; customer: string; total: number; status: string; date: string }[];
}

export type DateRange = '7d' | '30d' | '90d';

export async function getAnalyticsSummary(dateRange: DateRange = '30d'): Promise<AnalyticsData> {
    await requireAdminPermission(AdminPermissions.ALL);

    const now = new Date();
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[dateRange];
    
    const periodStart = new Date();
    periodStart.setDate(now.getDate() - days);
    
    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(now.getDate() - (days * 2));
    const previousPeriodEnd = new Date();
    previousPeriodEnd.setDate(now.getDate() - days);

    // Current period stats
    const [
        currentOrders,
        previousOrders,
        totalCustomersCount,
        previousCustomersCount,
        recentOrdersData,
        topItemsRaw,
        lowStockCount,
        orderStatusCounts
    ] = await prisma.$transaction([
        // Current period orders
        prisma.order.findMany({
            where: {
                createdAt: { gte: periodStart },
                status: { not: 'cancelled' }
            },
            select: { totalPrice: true, createdAt: true }
        }),
        // Previous period orders
        prisma.order.findMany({
            where: {
                createdAt: { gte: previousPeriodStart, lt: previousPeriodEnd },
                status: { not: 'cancelled' }
            },
            select: { totalPrice: true }
        }),
        // Current customers
        prisma.user.count({
            where: { createdAt: { gte: periodStart } }
        }),
        // Previous customers
        prisma.user.count({
            where: { createdAt: { gte: previousPeriodStart, lt: previousPeriodEnd } }
        }),
        // Recent orders for list
        prisma.order.findMany({
            where: { createdAt: { gte: periodStart } },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { user: { select: { name: true, email: true } } }
        }),
        // Top selling products
        prisma.orderItem.groupBy({
            by: ['productId', 'name'],
            where: {
                order: { createdAt: { gte: periodStart } }
            },
            _sum: { quantity: true, price: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        }),
        // Low stock count
        prisma.inventory.count({
            where: { available: { lt: 5 } }
        }),
        // Orders by status
        prisma.order.groupBy({
            by: ['status'],
            _count: { id: true },
            orderBy: { status: 'asc' }
        })
    ]);

    // Calculate metrics
    const currentRevenue = currentOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
    const previousRevenue = previousOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
    const currentOrderCount = currentOrders.length;
    const previousOrderCount = previousOrders.length;
    
    const currentAOV = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0;
    const previousAOV = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;

    // Calculate trends (percentage change)
    const calcTrend = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    // Process chart data (Group by Day)
    const salesMap = new Map<string, number>();
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        salesMap.set(d.toISOString().split('T')[0], 0);
    }

    currentOrders.forEach(order => {
        const dateKey = order.createdAt.toISOString().split('T')[0];
        if (salesMap.has(dateKey)) {
            salesMap.set(dateKey, (salesMap.get(dateKey) || 0) + Number(order.totalPrice));
        }
    });

    const salesTrend = Array.from(salesMap.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Process top products
    const topProducts = topItemsRaw.map(item => ({
        name: item.name,
        sold: item._sum?.quantity || 0,
        revenue: Number(item._sum?.price || 0)
    }));

    // Process orders by status
    const ordersByStatus = orderStatusCounts.map(s => ({
        status: s.status,
        count: typeof s._count === 'object' && s._count !== null ? (s._count as { id?: number }).id || 0 : 0
    }));

    // Process recent orders
    const recentOrders = recentOrdersData.map(order => ({
        id: order.id,
        customer: order.user?.name || order.user?.email || 'Guest',
        total: Number(order.totalPrice),
        status: order.status,
        date: order.createdAt.toISOString()
    }));

    // Get total stats (all time)
    const [totalOrdersAll, totalRevenueAll, totalCustomersAll] = await prisma.$transaction([
        prisma.order.count(),
        prisma.order.aggregate({ _sum: { totalPrice: true } }),
        prisma.user.count()
    ]);

    return {
        totalRevenue: Number(totalRevenueAll._sum.totalPrice || 0),
        totalOrders: totalOrdersAll,
        totalCustomers: totalCustomersAll,
        averageOrderValue: totalOrdersAll > 0 ? Number(totalRevenueAll._sum.totalPrice || 0) / totalOrdersAll : 0,
        salesTrend,
        topProducts,
        lowStockCount,
        revenueTrend: calcTrend(currentRevenue, previousRevenue),
        ordersTrend: calcTrend(currentOrderCount, previousOrderCount),
        customersTrend: calcTrend(totalCustomersCount, previousCustomersCount),
        aovTrend: calcTrend(currentAOV, previousAOV),
        ordersByStatus,
        recentOrders
    };
}
