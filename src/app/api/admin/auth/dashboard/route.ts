import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/auth/dashboard
 *
 * Returns quick stats for the mobile dashboard.
 * Requires Bearer token.
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Run all queries in parallel for speed
        const [
            todayOrders,
            todayRevenue,
            pendingOrders,
            totalProducts,
            lowStockCount,
        ] = await Promise.all([
            // Today's order count
            prisma.order.count({
                where: { createdAt: { gte: today } },
            }),

            // Today's revenue
            prisma.order.aggregate({
                where: { createdAt: { gte: today } },
                _sum: { totalPrice: true },
            }),

            // Pending orders
            prisma.order.count({
                where: { status: 'pending' },
            }),

            // Total active products
            prisma.product.count({
                where: { status: 'active' },
            }),

            // Low stock alerts (available <= 5)
            prisma.inventory.count({
                where: { available: { lte: 5 } },
            }),
        ]);

        return NextResponse.json({
            todayOrders,
            todayRevenue: todayRevenue._sum.totalPrice?.toNumber() || 0,
            pendingOrders,
            totalProducts,
            lowStockCount,
            admin: {
                name: admin.name,
                username: admin.username,
                role: admin.role?.name || 'admin',
            },
        });
    } catch (error) {
        console.error('Mobile Dashboard Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}
