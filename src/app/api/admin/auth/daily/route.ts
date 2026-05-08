import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/auth/daily
 * Comprehensive daily report data
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');

        const targetDate = dateStr ? new Date(dateStr) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Previous day for comparison
        const prevStart = new Date(startOfDay);
        prevStart.setDate(prevStart.getDate() - 1);
        const prevEnd = new Date(prevStart);
        prevEnd.setHours(23, 59, 59, 999);

        const where = { createdAt: { gte: startOfDay, lte: endOfDay } };
        const prevWhere = { createdAt: { gte: prevStart, lte: prevEnd } };

        const [
            orders,
            revenue,
            prevOrders,
            prevRevenue,
            ordersByStatus,
            topProducts,
            orderSources,
            paymentMethods,
            cityBreakdown,
            recentOrders,
            avgOrderValue,
            newCustomers,
        ] = await Promise.all([
            prisma.order.count({ where }),
            prisma.order.aggregate({
                where: { ...where, status: { notIn: ['CANCELLED', 'REJECTED', 'FAILED'] } },
                _sum: { totalPrice: true },
            }),
            prisma.order.count({ where: prevWhere }),
            prisma.order.aggregate({
                where: { ...prevWhere, status: { notIn: ['CANCELLED', 'REJECTED', 'FAILED'] } },
                _sum: { totalPrice: true },
            }),
            prisma.order.groupBy({
                by: ['status'],
                where,
                _count: { _all: true },
            }),
            prisma.orderItem.groupBy({
                by: ['name'],
                where: { order: where },
                _sum: { quantity: true },
                _count: true,
                orderBy: { _sum: { quantity: 'desc' } },
                take: 10,
            }),
            prisma.order.groupBy({
                by: ['orderSource'],
                where,
                _count: true,
            }),
            prisma.order.groupBy({
                by: ['paymentMethod'],
                where,
                _count: true,
            }),
            prisma.order.groupBy({
                by: ['shippingCity'],
                where: { ...where, shippingCity: { not: null } },
                _count: true,
                orderBy: { _count: { shippingCity: 'desc' } },
                take: 5,
            }),
            prisma.order.findMany({
                where,
                select: {
                    id: true,
                    orderNumber: true,
                    customerName: true,
                    totalPrice: true,
                    status: true,
                    paymentMethod: true,
                    createdAt: true,
                    items: { select: { name: true, quantity: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 15,
            }),
            prisma.order.aggregate({
                where: { ...where, status: { notIn: ['CANCELLED', 'REJECTED', 'FAILED'] } },
                _avg: { totalPrice: true },
            }),
            prisma.user.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
        ]);

        const todayRev = revenue._sum.totalPrice?.toNumber() || 0;
        const prevRev = prevRevenue._sum.totalPrice?.toNumber() || 0;
        const revenueGrowth = prevRev > 0 ? ((todayRev - prevRev) / prevRev) * 100 : 0;
        const ordersGrowth = prevOrders > 0 ? ((orders - prevOrders) / prevOrders) * 100 : 0;

        return NextResponse.json({
            date: startOfDay.toISOString().split('T')[0],
            totalOrders: orders,
            totalRevenue: todayRev,
            previousDay: {
                orders: prevOrders,
                revenue: prevRev,
            },
            growth: {
                revenueGrowth: Math.round(revenueGrowth * 10) / 10,
                ordersGrowth: Math.round(ordersGrowth * 10) / 10,
            },
            averageOrderValue: avgOrderValue._avg.totalPrice?.toNumber() || 0,
            newCustomers,
            statusBreakdown: ordersByStatus.map(s => ({
                status: s.status,
                count: s._count._all,
            })),
            topProducts: topProducts.map(p => ({
                name: p.name,
                quantity: p._sum.quantity || 0,
                orders: p._count,
            })),
            orderSources: orderSources.map(s => ({
                source: s.orderSource,
                count: (s._count as number) || 0,
            })),
            paymentMethods: paymentMethods.map(p => ({
                method: p.paymentMethod,
                count: (p._count as number) || 0,
            })),
            cityBreakdown: cityBreakdown.map(c => ({
                city: c.shippingCity,
                count: (c._count as number) || 0,
            })),
            recentOrders: recentOrders.map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                customer: o.customerName || 'Guest',
                total: o.totalPrice.toNumber(),
                status: o.status,
                payment: o.paymentMethod,
                time: o.createdAt.toISOString(),
                itemCount: o.items.length,
            })),
        });
    } catch (error) {
        console.error('Mobile Daily Report Error:', error);
        return NextResponse.json({ error: 'Failed to fetch daily report' }, { status: 500 });
    }
}
