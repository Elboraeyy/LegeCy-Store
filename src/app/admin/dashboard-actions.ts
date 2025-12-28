"use server";

import prisma from "@/lib/prisma";
import { AdminPermissions } from "@/lib/auth/permissions";
import { requireAdminPermission } from "@/lib/auth/guards";
import { subDays, subMonths, format } from "date-fns";

export type DateRangeType = '7d' | '30d' | '90d' | '12m' | 'all';

interface DashboardStatsParams {
    range?: DateRangeType;
}

export interface DashboardStats {
    kpi: {
        revenue: { value: number; change: number };
        orders: { value: number; change: number };
        pending: { value: number; change: number };
        lowStock: { value: number; change: number };
        aov: { value: number; change: number };
    };
    charts: {
        revenue: { date: string; revenue: number }[];
        status: { name: string; value: number }[];
    };
    lists: {
        topProducts: { name: string; quantity: number; revenue: number }[];
        recentActivity: { id: string; type: string; message: string; date: string; amount: number; status: string }[];
    };
}

export async function fetchDashboardStats({ range = '30d' }: DashboardStatsParams = {}): Promise<DashboardStats> {
    await requireAdminPermission(AdminPermissions.DASHBOARD.VIEW);

    const now = new Date();
    let startDate = subDays(now, 30);
    const endDate = now;

    // Determine Date Range
    switch (range) {
        case '7d': startDate = subDays(now, 7); break;
        case '30d': startDate = subDays(now, 30); break;
        case '90d': startDate = subDays(now, 90); break;
        case '12m': startDate = subMonths(now, 12); break;
        case 'all': startDate = new Date(0); break; // Epoch
    }

    // Previous Period for Comparison (Same duration just before)
    const duration = endDate.getTime() - startDate.getTime();
    const prevEndDate = startDate;
    const prevStartDate = new Date(prevEndDate.getTime() - duration);

    // Parallel Data Fetching
    const [
        currentPeriodOrders,
        previousPeriodOrders,
        currentPeriodRevenue,
        previousPeriodRevenue,
        pendingOrdersCount,
        lowStockCount,
        topProducts,
        recentOrders,
        statusDistribution
    ] = await Promise.all([
        // 1. Current Period Orders (Count)
        prisma.order.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
        
        // 2. Prev Period Orders (Count)
        prisma.order.count({ where: { createdAt: { gte: prevStartDate, lte: prevEndDate } } }),

        // 3. Current Revenue
        prisma.order.aggregate({
            _sum: { totalPrice: true },
            where: { createdAt: { gte: startDate, lte: endDate }, status: { not: 'cancelled' } }
        }),

        // 4. Prev Revenue
        prisma.order.aggregate({
            _sum: { totalPrice: true },
            where: { createdAt: { gte: prevStartDate, lte: prevEndDate }, status: { not: 'cancelled' } }
        }),

        // 5. Global Pending
        prisma.order.count({ where: { status: 'pending' } }),

        // 6. Low Stock (Global)
        prisma.inventory.count({ where: { available: { lte: 5 } } }),

        // 7. Top Selling Products (by quantity in period)
        prisma.orderItem.groupBy({
            by: ['name'],
            _sum: { quantity: true, price: true },
            where: { order: { createdAt: { gte: startDate, lte: endDate }, status: 'paid' } },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        }),

        // 8. Recent Activity
        prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, email: true } } }
        }),

        // 9. Status Distribution (Pie Chart)
        prisma.order.groupBy({
            by: ['status'],
            _count: { status: true },
            where: { createdAt: { gte: startDate, lte: endDate } }
        })
    ]);

    // Fetch Daily Sales for Chart
    const ordersForChart = await prisma.order.findMany({
        where: { createdAt: { gte: startDate, lte: endDate }, status: { not: 'cancelled' } },
        select: { createdAt: true, totalPrice: true }
    });

    // Process Chart Data
    const salesMap = new Map<string, number>();
    ordersForChart.forEach(o => {
        const key = format(o.createdAt, 'yyyy-MM-dd');
        salesMap.set(key, (salesMap.get(key) || 0) + Number(o.totalPrice));
    });
    
    // Fill gaps
    const chartData = [];
    let loopDate = startDate;
    while (loopDate <= endDate) {
        const key = format(loopDate, 'yyyy-MM-dd');
        chartData.push({
            date: key,
            revenue: salesMap.get(key) || 0
        });
        loopDate = new Date(loopDate.getTime() + 86400000); // +1 day
    }

    // Calculations
    const currentRev = Number(currentPeriodRevenue._sum.totalPrice || 0);
    const prevRev = Number(previousPeriodRevenue._sum.totalPrice || 0);
    const revChange = prevRev === 0 ? 100 : ((currentRev - prevRev) / prevRev) * 100;

    const currentOrd = currentPeriodOrders;
    const prevOrd = previousPeriodOrders;
    const ordChange = prevOrd === 0 ? 100 : ((currentOrd - prevOrd) / prevOrd) * 100;

    const aov = currentOrd === 0 ? 0 : currentRev / currentOrd;

    return {
        kpi: {
            revenue: { value: currentRev, change: revChange },
            orders: { value: currentOrd, change: ordChange },
            pending: { value: pendingOrdersCount, change: 0 },
            lowStock: { value: lowStockCount, change: 0 },
            aov: { value: aov, change: 0 },
        },
        charts: {
            revenue: chartData,
            status: statusDistribution.map(s => ({ name: s.status, value: s._count.status })),
        },
        lists: {
            topProducts: topProducts.map(p => ({ 
                name: p.name, 
                quantity: p._sum.quantity || 0, 
                revenue: Number(p._sum.price || 0) 
            })),
            recentActivity: recentOrders.map(o => ({
                id: o.id,
                type: 'order',
                message: `New order from ${o.user?.name || 'Guest'}`,
                date: o.createdAt.toISOString(),
                amount: Number(o.totalPrice),
                status: o.status
            }))
        }
    };
}
