import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';
import { revenueOrderStatusFilter } from '@/lib/order-metrics';

/**
 * GET /api/admin/auth/dashboard
 *
 * Returns comprehensive stats for the mobile dashboard.
 * Requires Bearer token.
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Build last 7 days date range
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        // Build last 30 days date range
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

        // Run all queries in parallel for speed
        const [
            todayOrders,
            todayRevenue,
            yesterdayOrders,
            yesterdayRevenue,
            pendingOrders,
            processingOrders,
            shippedOrders,
            deliveredOrders,
            totalProducts,
            lowStockCount,
            totalCustomers,
            newCustomersToday,
            monthlyRevenue,
            totalOrdersThisMonth,
            recentOrders,
            topProducts,
            ordersByStatus,
            weeklyRevenueRaw,
            recentReviews,
            pendingMessages,
            pendingStockRequests,
            activeCoupons,
        ] = await Promise.all([
            // Today's order count
            prisma.order.count({
                where: { createdAt: { gte: today }, status: revenueOrderStatusFilter },
            }),

            // Today's revenue
            prisma.order.aggregate({
                where: { createdAt: { gte: today }, status: revenueOrderStatusFilter },
                _sum: { totalPrice: true },
            }),

            // Yesterday's order count (for comparison)
            prisma.order.count({
                where: { createdAt: { gte: yesterday, lt: today }, status: revenueOrderStatusFilter },
            }),

            // Yesterday's revenue (for comparison)
            prisma.order.aggregate({
                where: { createdAt: { gte: yesterday, lt: today }, status: revenueOrderStatusFilter },
                _sum: { totalPrice: true },
            }),

            // Pending orders
            prisma.order.count({
                where: { status: 'pending' },
            }),

            // Processing orders
            prisma.order.count({
                where: { status: 'processing' },
            }),

            // Shipped orders
            prisma.order.count({
                where: { status: 'shipped' },
            }),

            // Delivered orders
            prisma.order.count({
                where: { status: 'delivered' },
            }),

            // Total active products
            prisma.product.count({
                where: { status: 'active' },
            }),

            // Low stock alerts (available <= 5)
            prisma.inventory.count({
                where: { available: { lte: 5 } },
            }),

            // Total customers
            prisma.user.count(),

            // New customers today
            prisma.user.count({
                where: { createdAt: { gte: today } },
            }),

            // Monthly revenue
            prisma.order.aggregate({
                where: { createdAt: { gte: thirtyDaysAgo }, status: revenueOrderStatusFilter },
                _sum: { totalPrice: true },
            }),

            // Total orders this month
            prisma.order.count({
                where: { createdAt: { gte: thirtyDaysAgo }, status: revenueOrderStatusFilter },
            }),

            // Recent 8 orders
            prisma.order.findMany({
                take: 8,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    totalPrice: true,
                    createdAt: true,
                    customerName: true,
                    firstName: true,
                    lastName: true,
                    orderSource: true,
                    paymentMethod: true,
                    shippingGovernorate: true,
                    _count: { select: { items: true } },
                },
            }),

            // Top 5 selling products (last 30 days)
            prisma.orderItem.groupBy({
                by: ['productId', 'name'],
                where: {
                    order: { createdAt: { gte: thirtyDaysAgo }, status: revenueOrderStatusFilter },
                },
                _sum: { quantity: true },
                _count: true,
                orderBy: { _sum: { quantity: 'desc' } },
                take: 5,
            }),

            // Orders by status breakdown
            prisma.order.groupBy({
                by: ['status'],
                _count: true,
            }),

            // Weekly revenue (last 7 days, raw orders)
            prisma.order.findMany({
                where: {
                    createdAt: { gte: sevenDaysAgo },
                    status: revenueOrderStatusFilter,
                },
                select: {
                    totalPrice: true,
                    createdAt: true,
                },
            }),

            // Recent reviews count
            prisma.review.count({
                where: { createdAt: { gte: sevenDaysAgo } },
            }),

            // Pending contact messages
            prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
                `SELECT COUNT(*) as count FROM "ContactMessage" WHERE "isRead" = false`
            ).catch(() => [{ count: BigInt(0) }]),

            // Pending stock notification requests
            prisma.stockNotification.count({
                where: { status: 'pending' },
            }),

            // Active coupons
            prisma.coupon.count({
                where: { isActive: true },
            }),
        ]);

        // Process weekly revenue into daily buckets
        const weeklyRevenue: Record<string, number> = {};
        const weeklyOrders: Record<string, number> = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            const key = d.toISOString().split('T')[0];
            weeklyRevenue[key] = 0;
            weeklyOrders[key] = 0;
        }
        for (const order of weeklyRevenueRaw) {
            const key = new Date(order.createdAt).toISOString().split('T')[0];
            if (weeklyRevenue[key] !== undefined) {
                weeklyRevenue[key] += Number(order.totalPrice) || 0;
                weeklyOrders[key] = (weeklyOrders[key] || 0) + 1;
            }
        }

        // Build weekly chart data
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyChart = Object.entries(weeklyRevenue).map(([date, revenue]) => {
            const d = new Date(date);
            return {
                day: dayNames[d.getDay()],
                date,
                revenue: Math.round(revenue),
                orders: weeklyOrders[date] || 0,
            };
        });

        // Process order status breakdown
        const statusBreakdown: Record<string, number> = {};
        for (const group of ordersByStatus) {
            statusBreakdown[group.status] = group._count;
        }

        // Format recent orders
        const formattedOrders = recentOrders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            totalPrice: Number(order.totalPrice),
            createdAt: order.createdAt.toISOString(),
            displayName: order.customerName || [order.firstName, order.lastName].filter(Boolean).join(' ') || 'Guest',
            itemCount: order._count.items,
            orderSource: order.orderSource,
            paymentMethod: order.paymentMethod,
            governorate: order.shippingGovernorate,
        }));

        // Format top products
        const formattedTopProducts = topProducts.map(p => ({
            productId: p.productId,
            name: p.name,
            totalSold: p._sum.quantity || 0,
            orderCount: p._count,
        }));

        // Compute comparisons
        const todayRev = todayRevenue._sum.totalPrice?.toNumber() || 0;
        const yesterdayRev = yesterdayRevenue._sum.totalPrice?.toNumber() || 0;
        const revenueChange = yesterdayRev > 0 ? Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100) : todayRev > 0 ? 100 : 0;
        const ordersChange = yesterdayOrders > 0 ? Math.round(((todayOrders - yesterdayOrders) / yesterdayOrders) * 100) : todayOrders > 0 ? 100 : 0;

        return NextResponse.json({
            // Core stats
            todayOrders,
            todayRevenue: todayRev,
            pendingOrders,
            processingOrders,
            shippedOrders,
            deliveredOrders,
            totalProducts,
            lowStockCount,

            // Comparisons
            yesterdayOrders,
            yesterdayRevenue: yesterdayRev,
            revenueChange,
            ordersChange,

            // Customer stats
            totalCustomers,
            newCustomersToday,

            // Monthly overview
            monthlyRevenue: monthlyRevenue._sum.totalPrice?.toNumber() || 0,
            totalOrdersThisMonth,

            // Charts
            weeklyChart,
            statusBreakdown,

            // Lists
            recentOrders: formattedOrders,
            topProducts: formattedTopProducts,

            // Badges / Alerts
            recentReviews,
            pendingMessages: Number(pendingMessages[0]?.count || 0),
            pendingStockRequests,
            activeCoupons,

            // Admin info
            admin: {
                name: admin.name,
                username: admin.username,
                role: admin.role?.name || 'admin',
            },

            // Timestamp
            generatedAt: now.toISOString(),
        });
    } catch (error) {
        console.error('Mobile Dashboard Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}
