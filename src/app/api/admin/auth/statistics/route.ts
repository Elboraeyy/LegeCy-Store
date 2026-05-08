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

        const [
            // Overview KPIs
            totalOrders,
            totalRevenue,
            todayOrders,
            todayRevenue,
            yesterdayOrders,
            yesterdayRevenue,
            last7Revenue,
            last7Orders,
            thisMonthRevenue,
            thisMonthOrders,
            lastMonthRevenue,
            lastMonthOrders,

            // Counts
            pendingOrders,
            processingOrders,
            shippedOrders,
            deliveredOrders,
            cancelledOrders,
            totalCustomers,
            totalProducts,
            lowStockCount,

            // Top data
            topProducts,
            topCustomers,
            topCities,

            // Order sources
            orderSources,

            // Payment methods
            paymentMethods,

            // Daily revenue for chart (last 30 days)
            dailyOrders,

            // Average order value
            avgOrderValue,

            // Repeat customer rate
            repeatCustomers,
        ] = await Promise.all([
            // Total orders (all time)
            prisma.order.count(),
            prisma.order.aggregate({ _sum: { totalPrice: true } }),

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
            prisma.order.count({ where: { status: 'pending' } }),
            prisma.order.count({ where: { status: 'processing' } }),
            prisma.order.count({ where: { status: 'shipped' } }),
            prisma.order.count({ where: { status: 'delivered' } }),
            prisma.order.count({ where: { status: { in: ['cancelled', 'CANCELLED'] } } }),
            prisma.user.count(),
            prisma.product.count({ where: { status: 'active' } }),
            prisma.inventory.count({ where: { available: { lte: 5 } } }),

            // Top 10 products
            prisma.orderItem.groupBy({
                by: ['name'],
                _sum: { quantity: true },
                _count: true,
                orderBy: { _sum: { quantity: 'desc' } },
                take: 10,
            }),

            // Top 10 customers
            prisma.order.groupBy({
                by: ['customerName'],
                where: { customerName: { not: null } },
                _count: true,
                _sum: { totalPrice: true },
                orderBy: { _sum: { totalPrice: 'desc' } },
                take: 10,
            }),

            // Top cities
            prisma.order.groupBy({
                by: ['shippingCity'],
                where: { shippingCity: { not: null } },
                _count: true,
                orderBy: { _count: { shippingCity: 'desc' } },
                take: 10,
            }),

            // Order sources
            prisma.order.groupBy({
                by: ['orderSource'],
                _count: true,
                _sum: { totalPrice: true },
            }),

            // Payment methods
            prisma.order.groupBy({
                by: ['paymentMethod'],
                _count: true,
                _sum: { totalPrice: true },
            }),

            // Last 30 days daily data for charts
            prisma.order.findMany({
                where: { createdAt: { gte: thirtyDaysAgo } },
                select: { createdAt: true, totalPrice: true, status: true },
                orderBy: { createdAt: 'asc' },
            }),

            // Average order value
            prisma.order.aggregate({
                _avg: { totalPrice: true },
                where: { status: { notIn: ['cancelled', 'CANCELLED'] } },
            }),

            // Repeat customers (users with more than 1 order)
            prisma.order.groupBy({
                by: ['customerEmail'],
                where: { customerEmail: { not: null } },
                _count: true,
                having: { customerEmail: { _count: { gt: 1 } } },
            }),
        ]);

        // Process daily revenue data for chart
        const dailyMap = new Map<string, { revenue: number; orders: number }>();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            dailyMap.set(key, { revenue: 0, orders: 0 });
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

        return NextResponse.json({
            overview: {
                totalOrders,
                totalRevenue: totalRevenue._sum.totalPrice?.toNumber() || 0,
                todayOrders,
                todayRevenue: todayRev,
                yesterdayOrders,
                yesterdayRevenue: yesterdayRev,
                last7Days: {
                    revenue: last7Revenue._sum.totalPrice?.toNumber() || 0,
                    orders: last7Orders,
                },
                thisMonth: {
                    revenue: thisMonthRev,
                    orders: thisMonthOrders,
                },
                lastMonth: {
                    revenue: lastMonthRev,
                    orders: lastMonthOrders,
                },
                averageOrderValue: avgOrderValue._avg.totalPrice?.toNumber() || 0,
                totalCustomers,
                totalProducts,
                lowStockCount,
                repeatCustomerCount: repeatCustomers.length,
                repeatCustomerRate: totalCustomers > 0
                    ? Math.round((repeatCustomers.length / totalCustomers) * 100)
                    : 0,
            },
            growth: {
                revenueGrowth: Math.round(revenueGrowth * 10) / 10,
                ordersGrowth: Math.round(ordersGrowth * 10) / 10,
                monthlyRevenueGrowth: Math.round(monthlyRevenueGrowth * 10) / 10,
                monthlyOrdersGrowth: Math.round(monthlyOrdersGrowth * 10) / 10,
            },
            statusDistribution: {
                pending: pendingOrders,
                processing: processingOrders,
                shipped: shippedOrders,
                delivered: deliveredOrders,
                cancelled: cancelledOrders,
            },
            revenueTrend,
            hourlyDistribution,
            topProducts: topProducts.map(p => ({
                name: p.name,
                quantity: p._sum.quantity || 0,
                orders: p._count,
            })),
            topCustomers: topCustomers.map(c => ({
                name: c.customerName,
                orders: (c._count as number) || 0,
                spent: (c._sum as { totalPrice: { toNumber: () => number } | null })?.totalPrice?.toNumber() || 0,
            })),
            topCities: topCities.map(c => ({
                city: c.shippingCity,
                orders: (c._count as number) || 0,
            })),
            orderSources: orderSources.map(s => ({
                source: s.orderSource,
                count: (s._count as number) || 0,
                revenue: (s._sum as { totalPrice: { toNumber: () => number } | null })?.totalPrice?.toNumber() || 0,
            })),
            paymentMethods: paymentMethods.map(p => ({
                method: p.paymentMethod,
                count: (p._count as number) || 0,
                revenue: (p._sum as { totalPrice: { toNumber: () => number } | null })?.totalPrice?.toNumber() || 0,
            })),
        });
    } catch (error) {
        console.error('Mobile Statistics Error:', error);
        return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }
}
