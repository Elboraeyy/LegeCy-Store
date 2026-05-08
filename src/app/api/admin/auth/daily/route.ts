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
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        const targetStart = startDateStr ? new Date(startDateStr) : (dateStr ? new Date(dateStr) : new Date());
        const targetEnd = endDateStr ? new Date(endDateStr) : (dateStr ? new Date(dateStr) : new Date());

        const startOfDay = new Date(targetStart);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetEnd);
        endOfDay.setHours(23, 59, 59, 999);

        // Calculate duration in days
        const durationDays = Math.max(1, Math.ceil((endOfDay.getTime() - startOfDay.getTime()) / (1000 * 60 * 60 * 24)));

        // Previous period for comparison (shift back by duration)
        const prevEnd = new Date(startOfDay);
        prevEnd.setDate(prevEnd.getDate() - 1);
        prevEnd.setHours(23, 59, 59, 999);
        
        const prevStart = new Date(prevEnd);
        prevStart.setDate(prevStart.getDate() - durationDays + 1);
        prevStart.setHours(0, 0, 0, 0);

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
            // NEW
            shippingData,
            discountData,
            returnsCount,
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
            
            // NEW: Shipping revenue for the period
            prisma.order.aggregate({
                where: { ...where, status: { notIn: ['CANCELLED', 'REJECTED', 'FAILED'] } },
                _sum: { shippingCost: true }
            }),

            // NEW: Discount costs for the period
            prisma.order.aggregate({
                where: { ...where, status: { notIn: ['CANCELLED', 'REJECTED', 'FAILED'] }, discountAmount: { gt: 0 } },
                _sum: { discountAmount: true }
            }),

            // NEW: Returns requested in the period
            prisma.returnRequest.count({
                where
            }),
        ]);

        const todayRev = revenue._sum.totalPrice?.toNumber() || 0;
        const prevRev = prevRevenue._sum.totalPrice?.toNumber() || 0;
        const revenueGrowth = prevRev > 0 ? ((todayRev - prevRev) / prevRev) * 100 : 0;
        const ordersGrowth = prevOrders > 0 ? ((orders - prevOrders) / prevOrders) * 100 : 0;

        // NEW computations
        const periodShipping = shippingData._sum.shippingCost?.toNumber() || 0;
        const periodDiscounts = discountData._sum.discountAmount?.toNumber() || 0;

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
            // NEW
            shippingRevenue: periodShipping,
            discountsGiven: periodDiscounts,
            returnsCount,
            
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
