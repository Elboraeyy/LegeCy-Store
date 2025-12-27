'use server';

import prisma from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';

export interface AnalyticsData {
    // Core KPIs
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    
    // Extended KPIs
    returnRate: number;
    couponUsageRate: number;
    avgItemsPerOrder: number;
    revenuePerCustomer: number;
    repeatCustomerRate: number;
    
    // NEW: Additional KPIs
    fulfillmentRate: number;         // Delivered / Total orders %
    cancelRate: number;              // Cancelled / Total orders %
    revenueGrowth: number;          // This period vs last period %
    ordersGrowth: number;           // This period vs last period %
    avgOrdersPerCustomer: number;    // Total orders / Total customers
    
    // Trend calculations
    revenueTrend: number;
    ordersTrend: number;
    customersTrend: number;
    aovTrend: number;
    
    // Charts Data
    salesTrend: { date: string; revenue: number; orders: number }[];
    ordersByStatus: { status: string; count: number }[];
    revenueByCategory: { category: string; revenue: number; orders: number }[];
    revenueByPaymentMethod: { method: string; revenue: number; count: number }[];
    ordersByCity: { city: string; count: number; revenue: number }[];
    ordersByHour: { hour: number; count: number }[];
    customerGrowth: { date: string; newCustomers: number; totalCustomers: number }[];
    
    // NEW: Monthly comparison (last 6 months)
    monthlyRevenue: { month: string; revenue: number; orders: number; customers: number }[];
    
    // NEW: Weekly comparison (last 4 weeks)
    weeklyRevenue: { week: string; revenue: number; orders: number }[];
    
    // NEW: Order Funnel
    orderFunnel: { stage: string; count: number; percentage: number }[];
    
    // NEW: Day of week distribution
    ordersByDayOfWeek: { day: string; count: number; revenue: number }[];
    
    // Lists
    topProducts: { name: string; sold: number; revenue: number }[];
    recentOrders: { id: string; customer: string; total: number; status: string; date: string }[];
    
    // NEW: Top customers
    topCustomers: { name: string; email: string; orders: number; revenue: number }[];
    
    // NEW: Recent activity
    recentActivity: { type: string; description: string; time: string }[];
    
    // Alerts
    lowStockCount: number;
    pendingReturns: number;
    
    // NEW: Period comparison
    periodComparison: {
        currentPeriod: { revenue: number; orders: number; customers: number };
        previousPeriod: { revenue: number; orders: number; customers: number };
    };
}

export type DateRange = '7d' | '30d' | '90d' | 'all' | 'custom';

export async function getAnalyticsSummary(
    dateRange: DateRange = '30d',
    customStart?: string,
    customEnd?: string
): Promise<AnalyticsData> {
    await requireAdminPermission(AdminPermissions.ALL);

    const now = new Date();
    
    let periodStart: Date;
    let days: number;
    
    if (dateRange === 'custom' && customStart && customEnd) {
        periodStart = new Date(customStart);
        const endDate = new Date(customEnd);
        days = Math.ceil((endDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    } else {
        const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, 'all': 3650 };
        days = daysMap[dateRange] || 30;
        periodStart = new Date();
        periodStart.setDate(now.getDate() - days);
    }
    
    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(now.getDate() - (days * 2));
    const previousPeriodEnd = new Date();
    previousPeriodEnd.setDate(now.getDate() - days);

    // 6 months ago for monthly comparison
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    // Main transaction for current period data
    const [
        currentOrders,
        previousOrders,
        totalCustomersCount,
        previousCustomersCount,
        recentOrdersData,
        topItemsRaw,
        lowStockCount,
        orderStatusCounts,
        returnRequestsCount,
        ordersWithCoupons,
        totalItemsCount,
        repeatCustomersCount,
        pendingReturns,
        deliveredOrdersCount,
        cancelledOrdersCount,
        allTimeOrders,
        topCustomersRaw,
        recentActivityOrders
    ] = await prisma.$transaction([
        // Current period orders with full details
        prisma.order.findMany({
            where: {
                createdAt: { gte: periodStart },
                status: { not: 'cancelled' }
            },
            select: { 
                totalPrice: true, 
                createdAt: true,
                paymentMethod: true,
                shippingCity: true,
                couponId: true,
                status: true,
                items: { select: { quantity: true } }
            }
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
            take: 10,
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
            take: 10
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
        }),
        // Return requests count
        prisma.returnRequest.count({
            where: { 
                order: { createdAt: { gte: periodStart } }
            }
        }),
        // Orders with coupons
        prisma.order.count({
            where: {
                createdAt: { gte: periodStart },
                couponId: { not: null }
            }
        }),
        // Total items sold
        prisma.orderItem.aggregate({
            where: {
                order: { createdAt: { gte: periodStart } }
            },
            _sum: { quantity: true }
        }),
        // Repeat customers (users with 2+ orders)
        prisma.user.count({
            where: {
                orders: { some: {} },
                AND: {
                    orders: { some: { createdAt: { gte: periodStart } } }
                }
            }
        }),
        // Pending returns
        prisma.returnRequest.count({
            where: { status: 'pending' }
        }),
        // Delivered orders count (for fulfillment rate)
        prisma.order.count({
            where: {
                createdAt: { gte: periodStart },
                status: 'delivered'
            }
        }),
        // Cancelled orders count
        prisma.order.count({
            where: {
                createdAt: { gte: periodStart },
                status: 'cancelled'
            }
        }),
        // All orders in period (including cancelled for funnel)
        prisma.order.findMany({
            where: { createdAt: { gte: periodStart } },
            select: { status: true }
        }),
        // Top customers by revenue
        prisma.order.groupBy({
            by: ['userId'],
            where: {
                createdAt: { gte: periodStart },
                userId: { not: null }
            },
            _sum: { totalPrice: true },
            _count: { id: true },
            orderBy: { _sum: { totalPrice: 'desc' } },
            take: 10
        }),
        // Recent orders for activity
        prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                status: true,
                totalPrice: true,
                createdAt: true,
                user: { select: { name: true } }
            }
        })
    ]);

    // Calculate core metrics
    const currentRevenue = currentOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
    const previousRevenue = previousOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
    const currentOrderCount = currentOrders.length;
    const previousOrderCount = previousOrders.length;
    const allOrdersInPeriod = allTimeOrders.length;
    
    const currentAOV = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0;
    const previousAOV = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;

    // Calculate trends
    const calcTrend = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    // Extended KPIs
    const returnRate = currentOrderCount > 0 ? (returnRequestsCount / currentOrderCount) * 100 : 0;
    const couponUsageRate = currentOrderCount > 0 ? (ordersWithCoupons / currentOrderCount) * 100 : 0;
    const totalItemsSold = totalItemsCount._sum?.quantity || 0;
    const avgItemsPerOrder = currentOrderCount > 0 ? totalItemsSold / currentOrderCount : 0;
    const fulfillmentRate = allOrdersInPeriod > 0 ? (deliveredOrdersCount / allOrdersInPeriod) * 100 : 0;
    const cancelRate = allOrdersInPeriod > 0 ? (cancelledOrdersCount / allOrdersInPeriod) * 100 : 0;
    const revenueGrowth = calcTrend(currentRevenue, previousRevenue);
    const ordersGrowth = calcTrend(currentOrderCount, previousOrderCount);

    // Process sales trend (daily)
    const salesMap = new Map<string, { revenue: number; orders: number }>();
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        salesMap.set(d.toISOString().split('T')[0], { revenue: 0, orders: 0 });
    }

    currentOrders.forEach(order => {
        const dateKey = order.createdAt.toISOString().split('T')[0];
        if (salesMap.has(dateKey)) {
            const current = salesMap.get(dateKey)!;
            salesMap.set(dateKey, { 
                revenue: current.revenue + Number(order.totalPrice),
                orders: current.orders + 1
            });
        }
    });

    const salesTrend = Array.from(salesMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Revenue by payment method
    const paymentMethodMap = new Map<string, { revenue: number; count: number }>();
    currentOrders.forEach(order => {
        const method = order.paymentMethod || 'cod';
        const current = paymentMethodMap.get(method) || { revenue: 0, count: 0 };
        paymentMethodMap.set(method, {
            revenue: current.revenue + Number(order.totalPrice),
            count: current.count + 1
        });
    });
    const revenueByPaymentMethod = Array.from(paymentMethodMap.entries())
        .map(([method, data]) => ({ method, ...data }));

    // Orders by city
    const cityMap = new Map<string, { count: number; revenue: number }>();
    currentOrders.forEach(order => {
        const city = order.shippingCity || 'Unknown';
        const current = cityMap.get(city) || { count: 0, revenue: 0 };
        cityMap.set(city, {
            count: current.count + 1,
            revenue: current.revenue + Number(order.totalPrice)
        });
    });
    const ordersByCity = Array.from(cityMap.entries())
        .map(([city, data]) => ({ city, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // Orders by hour of day
    const hourMap = new Map<number, number>();
    for (let h = 0; h < 24; h++) hourMap.set(h, 0);
    currentOrders.forEach(order => {
        const hour = order.createdAt.getHours();
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });
    const ordersByHour = Array.from(hourMap.entries())
        .map(([hour, count]) => ({ hour, count }));

    // Orders by day of week
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayMap = new Map<number, { count: number; revenue: number }>();
    for (let d = 0; d < 7; d++) dayMap.set(d, { count: 0, revenue: 0 });
    currentOrders.forEach(order => {
        const day = order.createdAt.getDay();
        const current = dayMap.get(day)!;
        dayMap.set(day, {
            count: current.count + 1,
            revenue: current.revenue + Number(order.totalPrice)
        });
    });
    const ordersByDayOfWeek = Array.from(dayMap.entries())
        .map(([day, data]) => ({ day: dayNames[day], ...data }));

    // Order funnel
    const statusCounts: Record<string, number> = {};
    allTimeOrders.forEach(o => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    const funnelStages = ['pending', 'processing', 'shipped', 'delivered'];
    const totalForFunnel = allOrdersInPeriod;
    const orderFunnel = funnelStages.map(stage => {
        const count = statusCounts[stage] || 0;
        const percentage = totalForFunnel > 0 ? (count / totalForFunnel) * 100 : 0;
        return { stage, count, percentage: Math.round(percentage) };
    });

    // Revenue by Category
    const categoryRevenueRaw = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { createdAt: { gte: periodStart } } },
        _sum: { price: true, quantity: true }
    });

    const productIds = categoryRevenueRaw.map(item => item.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, category: true, categoryRel: { select: { name: true } } }
    });

    const productCategoryMap = new Map<string, string>();
    products.forEach(p => {
        productCategoryMap.set(p.id, p.categoryRel?.name || p.category || 'Uncategorized');
    });

    const categoryMap = new Map<string, { revenue: number; orders: number }>();
    categoryRevenueRaw.forEach(item => {
        const category = productCategoryMap.get(item.productId) || 'Uncategorized';
        const current = categoryMap.get(category) || { revenue: 0, orders: 0 };
        categoryMap.set(category, {
            revenue: current.revenue + Number(item._sum?.price || 0),
            orders: current.orders + (item._sum?.quantity || 0)
        });
    });
    const revenueByCategory = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

    // Customer growth over time
    const customerGrowthRaw = await prisma.user.findMany({
        where: { createdAt: { gte: periodStart } },
        select: { createdAt: true }
    });

    const customerGrowthMap = new Map<string, number>();
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        customerGrowthMap.set(d.toISOString().split('T')[0], 0);
    }
    customerGrowthRaw.forEach(user => {
        const dateKey = user.createdAt.toISOString().split('T')[0];
        if (customerGrowthMap.has(dateKey)) {
            customerGrowthMap.set(dateKey, (customerGrowthMap.get(dateKey) || 0) + 1);
        }
    });

    let runningTotal = 0;
    const customerGrowth = Array.from(customerGrowthMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, newCustomers]) => {
            runningTotal += newCustomers;
            return { date, newCustomers, totalCustomers: runningTotal };
        });

    // Monthly revenue (last 6 months)
    const monthlyOrdersRaw = await prisma.order.findMany({
        where: {
            createdAt: { gte: sixMonthsAgo },
            status: { not: 'cancelled' }
        },
        select: { totalPrice: true, createdAt: true, userId: true }
    });

    const monthlyMap = new Map<string, { revenue: number; orders: number; customers: Set<string> }>();
    monthlyOrdersRaw.forEach(order => {
        const monthKey = order.createdAt.toISOString().slice(0, 7); // YYYY-MM
        const current = monthlyMap.get(monthKey) || { revenue: 0, orders: 0, customers: new Set<string>() };
        current.revenue += Number(order.totalPrice);
        current.orders += 1;
        if (order.userId) current.customers.add(order.userId);
        monthlyMap.set(monthKey, current);
    });
    const monthlyRevenue = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({ 
            month, 
            revenue: data.revenue, 
            orders: data.orders,
            customers: data.customers.size
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

    // Weekly revenue (last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(now.getDate() - 28);
    const weeklyOrdersRaw = await prisma.order.findMany({
        where: {
            createdAt: { gte: fourWeeksAgo },
            status: { not: 'cancelled' }
        },
        select: { totalPrice: true, createdAt: true }
    });

    const weeklyMap = new Map<number, { revenue: number; orders: number }>();
    for (let w = 0; w < 4; w++) weeklyMap.set(w, { revenue: 0, orders: 0 });
    weeklyOrdersRaw.forEach(order => {
        const daysAgo = Math.floor((now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const weekNum = Math.floor(daysAgo / 7);
        if (weekNum < 4) {
            const current = weeklyMap.get(weekNum)!;
            weeklyMap.set(weekNum, {
                revenue: current.revenue + Number(order.totalPrice),
                orders: current.orders + 1
            });
        }
    });
    const weekLabels = ['This Week', 'Last Week', '2 Weeks Ago', '3 Weeks Ago'];
    const weeklyRevenue = Array.from(weeklyMap.entries())
        .map(([week, data]) => ({ week: weekLabels[week], ...data }));

    // Top customers
    const customerUserIds = topCustomersRaw.map(c => c.userId).filter(Boolean) as string[];
    const customerUsers = await prisma.user.findMany({
        where: { id: { in: customerUserIds } },
        select: { id: true, name: true, email: true }
    });
    const customerUserMap = new Map(customerUsers.map(u => [u.id, u]));
    const topCustomers = topCustomersRaw.map(c => {
        const user = c.userId ? customerUserMap.get(c.userId) : null;
        const countObj = c._count as { id?: number } | undefined;
        return {
            name: user?.name || 'Guest',
            email: user?.email || '',
            orders: countObj?.id || 0,
            revenue: Number(c._sum?.totalPrice || 0)
        };
    });

    // Recent activity
    const recentActivity = recentActivityOrders.map(order => ({
        type: 'order',
        description: `${order.user?.name || 'Guest'} placed order #${order.id.slice(0, 8)} (${formatCurrencySimple(Number(order.totalPrice))})`,
        time: order.createdAt.toISOString()
    }));

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

    const allTimeRevenue = Number(totalRevenueAll._sum.totalPrice || 0);
    const revenuePerCustomer = totalCustomersAll > 0 ? allTimeRevenue / totalCustomersAll : 0;
    const avgOrdersPerCustomer = totalCustomersAll > 0 ? totalOrdersAll / totalCustomersAll : 0;

    return {
        // Core KPIs
        totalRevenue: allTimeRevenue,
        totalOrders: totalOrdersAll,
        totalCustomers: totalCustomersAll,
        averageOrderValue: totalOrdersAll > 0 ? allTimeRevenue / totalOrdersAll : 0,
        
        // Extended KPIs
        returnRate: Math.round(returnRate * 10) / 10,
        couponUsageRate: Math.round(couponUsageRate * 10) / 10,
        avgItemsPerOrder: Math.round(avgItemsPerOrder * 10) / 10,
        revenuePerCustomer: Math.round(revenuePerCustomer),
        repeatCustomerRate: totalCustomersAll > 0 ? Math.round((repeatCustomersCount / totalCustomersAll) * 100) : 0,
        
        // New KPIs
        fulfillmentRate: Math.round(fulfillmentRate * 10) / 10,
        cancelRate: Math.round(cancelRate * 10) / 10,
        revenueGrowth,
        ordersGrowth,
        avgOrdersPerCustomer: Math.round(avgOrdersPerCustomer * 10) / 10,
        
        // Trends
        revenueTrend: calcTrend(currentRevenue, previousRevenue),
        ordersTrend: calcTrend(currentOrderCount, previousOrderCount),
        customersTrend: calcTrend(totalCustomersCount, previousCustomersCount),
        aovTrend: calcTrend(currentAOV, previousAOV),
        
        // Charts
        salesTrend,
        ordersByStatus,
        revenueByCategory,
        revenueByPaymentMethod,
        ordersByCity,
        ordersByHour,
        customerGrowth,
        monthlyRevenue,
        weeklyRevenue,
        orderFunnel,
        ordersByDayOfWeek,
        
        // Lists
        topProducts,
        recentOrders,
        topCustomers,
        recentActivity,
        
        // Alerts
        lowStockCount,
        pendingReturns,
        
        // Period comparison
        periodComparison: {
            currentPeriod: { revenue: currentRevenue, orders: currentOrderCount, customers: totalCustomersCount },
            previousPeriod: { revenue: previousRevenue, orders: previousOrderCount, customers: previousCustomersCount }
        }
    };
}

function formatCurrencySimple(value: number): string {
    return `EGP ${value.toLocaleString()}`;
}
