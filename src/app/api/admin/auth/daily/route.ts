import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/auth/daily
 * Daily report data
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

        const where = { createdAt: { gte: startOfDay, lte: endOfDay } };

        const [
            orders,
            revenue,
            ordersByStatus,
            topProducts,
        ] = await Promise.all([
            prisma.order.count({ where }),
            prisma.order.aggregate({
                where: { ...where, status: { notIn: ['CANCELLED', 'PENDING', 'REJECTED', 'FAILED'] } },
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
                orderBy: { _sum: { quantity: 'desc' } },
                take: 10,
            }),
        ]);

        return NextResponse.json({
            date: startOfDay.toISOString().split('T')[0],
            totalOrders: orders,
            totalRevenue: revenue._sum.totalPrice?.toNumber() || 0,
            statusBreakdown: ordersByStatus.map(s => ({
                status: s.status,
                count: s._count._all,
            })),
            topProducts: topProducts.map(p => ({
                name: p.name,
                quantity: p._sum.quantity || 0,
            })),
        });
    } catch (error) {
        console.error('Mobile Daily Report Error:', error);
        return NextResponse.json({ error: 'Failed to fetch daily report' }, { status: 500 });
    }
}
