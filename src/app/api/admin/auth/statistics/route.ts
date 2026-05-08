import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/auth/statistics
 * Comprehensive statistics endpoint for the mobile admin app.
 * Provides: overview KPIs, revenue trends (last 30 days), order status distribution,
 * top products, top customers, order source breakdown, payment method breakdown,
 * city distribution, hourly order distribution, and monthly comparisons.
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sixtyDaysAgo = new Date(now);
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // Current month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        const { searchParams } = new URL(request.url);
        const startParam = searchParams.get('startDate');
        const endParam = searchParams.get('endDate');

        let dateFilter: any = {};
        let trendStart = thirtyDaysAgo;
        let trendEnd = new Date(now);

        if (startParam && endParam) {
            trendStart = new Date(startParam);
            trendStart.setHours(0, 0, 0, 0);
            trendEnd = new Date(endParam);
            trendEnd.setHours(23, 59, 59, 999);
            dateFilter = { createdAt: { gte: trendStart, lte: trendEnd } };
        }

        const sevenDaysFromNow = new Date(now);
        const fourteenDaysAgo = new Date(now);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const [
            totalOrders, totalRevenue, todayOrders, todayRevenue,
            yesterdayOrders, yesterdayRevenue, last7Revenue, last7Orders,
            thisMonthRevenue, thisMonthOrders, lastMonthRevenue, lastMonthOrders,
            pendingOrders, processingOrders, shippedOrders, deliveredOrders,
            cancelledOrders, totalCustomers, totalProducts, lowStockCount,
            topProducts, topCustomers, topCities, orderSources, paymentMethods,
            dailyOrders, avgOrderValue, repeatCustomers,
            // NEW
            shippingCosts, discountImpact, outOfStockCount,
            thisWeekRevenue, thisWeekOrders, lastWeekRevenue, lastWeekOrders,
            fulfillmentOrders,
        ] = await Promise.all([
            // Total orders (all time or filtered)
            prisma.order.count({ where: Object.keys(dateFilter).length > 0 ? dateFilter : undefined }),
            prisma.order.aggregate({ where: Object.keys(dateFilter).length > 0 ? dateFilter : undefined, _sum: { totalPrice: true } }),

            // Today
            prisma.order.count({ where: { createdAt: { gte: today } } }),
            prisma.order.aggregate({ where: { createdAt: { gte: today } }, _sum: { totalPrice: true } }),

            // Yesterday
            prisma.order.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
            prisma.order.aggregate({ where: { createdAt: { gte: yesterday, lt: today } }, _sum: { totalPrice: true } }),

            // Last 7 days
            prisma.order.aggregate({ where: { createdAt: { gte: sevenDaysAgo } }, _sum: { totalPrice: true } }),
            prisma.order.count({ where: { createdAt: { gte: sevenDaysAgo } } }),

            // This month
            prisma.order.aggregate({ where: { createdAt: { gte: startOfMonth } }, _sum: { totalPrice: true } }),
            prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),

            // Last month
            prisma.order.aggregate({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { totalPrice: true } }),
            prisma.order.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),

            // Status counts
            prisma.order.count({ where: { status: 'pending', ...dateFilter } }),
            prisma.order.count({ where: { status: 'processing', ...dateFilter } }),
            prisma.order.count({ where: { status: 'shipped', ...dateFilter } }),
            prisma.order.count({ where: { status: 'delivered', ...dateFilter } }),
            prisma.order.count({ where: { status: { in: ['cancelled', 'CANCELLED'] }, ...dateFilter } }),
            prisma.user.count({ where: Object.keys(dateFilter).length > 0 ? dateFilter : undefined }),
            prisma.product.count({ where: { status: 'active' } }),
            prisma.inventory.count({ where: { available: { lte: 5 } } }),

            // Top 10 products
            prisma.orderItem.groupBy({
                by: ['name'],
                where: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
                _sum: { quantity: true },
                _count: true,
                orderBy: { _sum: { quantity: 'desc' } },
                take: 10,
            }),

            // Top 10 customers
            prisma.order.groupBy({
                by: ['customerName'],
                where: { customerName: { not: null }, ...dateFilter },
                _count: true,
                _sum: { totalPrice: true },
                orderBy: { _sum: { totalPrice: 'desc' } },
                take: 10,
            }),

            // Top cities
            prisma.order.groupBy({
                by: ['shippingCity'],
                where: { shippingCity: { not: null }, ...dateFilter },
                _count: true,
                orderBy: { _count: { shippingCity: 'desc' } },
                take: 10,
            }),

            // Order sources
            prisma.order.groupBy({
                by: ['orderSource'],
                where: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
                _count: true,
                _sum: { totalPrice: true },
            }),

            // Payment methods
            prisma.order.groupBy({
                by: ['paymentMethod'],
                where: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
                _count: true,
                _sum: { totalPrice: true },
            }),

            // Trend daily data for charts
            prisma.order.findMany({
                where: { createdAt: { gte: trendStart, lte: trendEnd } },
                select: { createdAt: true, totalPrice: true, status: true },
                orderBy: { createdAt: 'asc' },
            }),

            // Average order value
            prisma.order.aggregate({
                _avg: { totalPrice: true },
                where: { status: { notIn: ['cancelled', 'CANCELLED'] }, ...dateFilter },
            }),

            // Repeat customers
            prisma.order.groupBy({
                by: ['customerEmail'],
                where: { customerEmail: { not: null }, ...dateFilter },
                _count: true,
                having: { customerEmail: { _count: { gt: 1 } } },
            }),
            // NEW: Shipping costs
            prisma.order.aggregate({
                where: { status: { notIn: ['cancelled', 'CANCELLED'] }, ...dateFilter },
                _sum: { shippingCost: true },
            }),
            // NEW: Discount impact
            prisma.order.aggregate({
                where: { discountAmount: { gt: 0 }, ...dateFilter },
                _sum: { discountAmount: true },
                _count: true,
            }),
            // NEW: Out of stock
            prisma.inventory.count({ where: { available: { lte: 0 } } }),
            // NEW: This week
            prisma.order.aggregate({ where: { createdAt: { gte: sevenDaysAgo } }, _sum: { totalPrice: true } }),
            prisma.order.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
            // NEW: Last week
            prisma.order.aggregate({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } }, _sum: { totalPrice: true } }),
            prisma.order.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
            // NEW: Fulfillment time
            prisma.order.findMany({
                where: { status: 'delivered', deliveredAt: { not: null }, ...dateFilter },
                select: { createdAt: true, deliveredAt: true },
                take: 500,
            }),
        ]);

        // Process daily revenue data for chart
        const dailyMap = new Map<string, { revenue: number; orders: number }>();
        const currentDate = new Date(trendStart);
        while (currentDate <= trendEnd) {
            const key = currentDate.toISOString().split('T')[0];
            dailyMap.set(key, { revenue: 0, orders: 0 });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        for (const order of dailyOrders) {
            const key = order.createdAt.toISOString().split('T')[0];
            const entry = dailyMap.get(key);
            if (entry) {
                entry.revenue += order.totalPrice.toNumber();
                entry.orders += 1;
            }
        }
        const revenueTrend = Array.from(dailyMap.entries()).map(([date, data]) => ({
            date,
            revenue: Math.round(data.revenue),
            orders: data.orders,
        }));

        // Hourly distribution
        const hourlyMap = new Map<number, number>();
        for (let h = 0; h < 24; h++) hourlyMap.set(h, 0);
        for (const order of dailyOrders) {
            const hour = order.createdAt.getHours();
            hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
        }
        const hourlyDistribution = Array.from(hourlyMap.entries()).map(([hour, count]) => ({
            hour,
            orders: count,
        }));

        // Calculate growth percentages
        const todayRev = todayRevenue._sum.totalPrice?.toNumber() || 0;
        const yesterdayRev = yesterdayRevenue._sum.totalPrice?.toNumber() || 0;
        const revenueGrowth = yesterdayRev > 0 ? ((todayRev - yesterdayRev) / yesterdayRev) * 100 : 0;
        const ordersGrowth = yesterdayOrders > 0 ? ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100 : 0;

        const thisMonthRev = thisMonthRevenue._sum.totalPrice?.toNumber() || 0;
        const lastMonthRev = lastMonthRevenue._sum.totalPrice?.toNumber() || 0;
        const monthlyRevenueGrowth = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0;
        const monthlyOrdersGrowth = lastMonthOrders > 0 ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 : 0;

        // NEW calculations
        const totRevNum = totalRevenue._sum.totalPrice?.toNumber() || 0;
        const cancellationRate = totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 1000) / 10 : 0;
        const totalShipping = shippingCosts._sum.shippingCost?.toNumber() || 0;
        const shippingPct = totRevNum > 0 ? Math.round((totalShipping / totRevNum) * 1000) / 10 : 0;
        const totalDiscounts = discountImpact._sum.discountAmount?.toNumber() || 0;
        const discountPct = totRevNum > 0 ? Math.round((totalDiscounts / totRevNum) * 1000) / 10 : 0;
        const thisWeekRev = thisWeekRevenue._sum.totalPrice?.toNumber() || 0;
        const lastWeekRev = lastWeekRevenue._sum.totalPrice?.toNumber() || 0;
        const weeklyGrowth = lastWeekRev > 0 ? ((thisWeekRev - lastWeekRev) / lastWeekRev) * 100 : 0;
        let avgFulfillmentDays = 0;
        if (fulfillmentOrders.length > 0) {
            const totalDays = fulfillmentOrders.reduce((sum: number, o: any) => {
                return sum + (o.deliveredAt!.getTime() - o.createdAt.getTime()) / 86400000;
            }, 0);
            avgFulfillmentDays = Math.round((totalDays / fulfillmentOrders.length) * 10) / 10;
        }

        return NextResponse.json({
            overview: {
                totalOrders,
                totalRevenue: totRevNum,
                todayOrders,
                todayRevenue: todayRev,
                yesterdayOrders,
                yesterdayRevenue: yesterdayRev,
                last7Days: { revenue: last7Revenue._sum.totalPrice?.toNumber() || 0, orders: last7Orders },
                thisMonth: { revenue: thisMonthRev, orders: thisMonthOrders },
                lastMonth: { revenue: lastMonthRev, orders: lastMonthOrders },
                averageOrderValue: avgOrderValue._avg.totalPrice?.toNumber() || 0,
                totalCustomers, totalProducts, lowStockCount, outOfStockCount,
                repeatCustomerCount: repeatCustomers.length,
                repeatCustomerRate: totalCustomers > 0 ? Math.round((repeatCustomers.length / totalCustomers) * 100) : 0,
                cancellationRate, totalShipping, shippingPct,
                totalDiscounts, discountPct,
                discountedOrderCount: discountImpact._count ?? 0,
                avgFulfillmentDays,
            },
            growth: {
                revenueGrowth: Math.round(revenueGrowth * 10) / 10,
                ordersGrowth: Math.round(ordersGrowth * 10) / 10,
                monthlyRevenueGrowth: Math.round(monthlyRevenueGrowth * 10) / 10,
                monthlyOrdersGrowth: Math.round(monthlyOrdersGrowth * 10) / 10,
                weeklyRevenueGrowth: Math.round(weeklyGrowth * 10) / 10,
            },
            weeklyComparison: {
                thisWeek: { revenue: thisWeekRev, orders: thisWeekOrders },
                lastWeek: { revenue: lastWeekRev, orders: lastWeekOrders },
            },
            statusDistribution: {
                pending: pendingOrders, processing: processingOrders,
                shipped: shippedOrders, delivered: deliveredOrders, cancelled: cancelledOrders,
            },
            revenueTrend, hourlyDistribution,
            topProducts: topProducts.map(p => ({ name: p.name, quantity: p._sum.quantity || 0, orders: p._count })),
            topCustomers: topCustomers.map(c => ({
                name: c.customerName, orders: (c._count as number) || 0,
                spent: (c._sum as any)?.totalPrice?.toNumber() || 0,
            })),
            topCities: topCities.map(c => ({ city: c.shippingCity, orders: (c._count as number) || 0 })),
            orderSources: orderSources.map(s => ({
                source: s.orderSource, count: (s._count as number) || 0,
                revenue: (s._sum as any)?.totalPrice?.toNumber() || 0,
            })),
            paymentMethods: paymentMethods.map(p => ({
                method: p.paymentMethod, count: (p._count as number) || 0,
                revenue: (p._sum as any)?.totalPrice?.toNumber() || 0,
            })),
        });
    } catch (error) {
        console.error('Mobile Statistics Error:', error);
        return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }
}
