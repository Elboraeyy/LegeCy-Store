import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';
import { cancellationOrderStatusFilter, revenueOrderStatusFilter } from '@/lib/order-metrics';

/**
 * GET /api/admin/auth/analytics
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [
            totalOrders,
            totalRevenue,
            last7DaysOrders,
            last7DaysRevenue,
            topProducts,
            topCustomers,
            recentOrders,
            cancelledOrders,
        ] = await Promise.all([
            prisma.order.count({ where: { status: revenueOrderStatusFilter } }),
            prisma.order.aggregate({ where: { status: revenueOrderStatusFilter }, _sum: { totalPrice: true } }),
            prisma.order.count({ where: { createdAt: { gte: sevenDaysAgo }, status: revenueOrderStatusFilter } }),
            prisma.order.aggregate({
                where: { createdAt: { gte: sevenDaysAgo }, status: revenueOrderStatusFilter },
                _sum: { totalPrice: true },
            }),
            prisma.orderItem.groupBy({
                by: ['name'],
                where: { order: { status: revenueOrderStatusFilter } },
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 10,
            }),
            prisma.order.groupBy({
                by: ['customerName'],
                where: { customerName: { not: null }, status: revenueOrderStatusFilter },
                _count: true,
                _sum: { totalPrice: true },
                orderBy: { _sum: { totalPrice: 'desc' } },
                take: 10,
            }),
            prisma.order.findMany({
                select: {
                    id: true,
                    orderNumber: true,
                    customerName: true,
                    totalPrice: true,
                    status: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
            prisma.order.count({ where: { status: cancellationOrderStatusFilter } }),
        ]);

        return NextResponse.json({
            totalOrders,
            totalRevenue: totalRevenue._sum.totalPrice?.toNumber() || 0,
            last7Days: {
                orders: last7DaysOrders,
                revenue: last7DaysRevenue._sum.totalPrice?.toNumber() || 0,
            },
            cancellations: {
                orders: cancelledOrders,
                rate: totalOrders + cancelledOrders > 0
                    ? Math.round((cancelledOrders / (totalOrders + cancelledOrders)) * 1000) / 10
                    : 0,
            },
            topProducts: topProducts.map(p => ({
                name: p.name,
                quantity: p._sum.quantity || 0,
            })),
            topCustomers: topCustomers.map(c => ({
                name: c.customerName,
                orders: (c._count as number) || 0,
                spent: (c._sum as { totalPrice: { toNumber: () => number } | null })?.totalPrice?.toNumber() || 0,
            })),
            recentOrders: recentOrders.map(o => ({
                ...o,
                totalPrice: o.totalPrice.toNumber(),
            })),
        });
    } catch (error) {
        console.error('Mobile Analytics Error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
