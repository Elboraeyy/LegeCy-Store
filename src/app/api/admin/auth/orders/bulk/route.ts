import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * PATCH /api/admin/auth/orders/bulk
 * Bulk update orders status
 */
export async function PATCH(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { orderIds, status } = body;

        if (!Array.isArray(orderIds) || orderIds.length === 0 || !status) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Get orders to know their previous status
        const orders = await prisma.order.findMany({
            where: { id: { in: orderIds } },
            select: { id: true, status: true }
        });

        const historyPromises = orders
            .filter(o => o.status !== status)
            .map(order => prisma.orderStatusHistory.create({
                data: {
                    orderId: order.id,
                    from: order.status,
                    to: status,
                    reason: `Bulk updated via mobile app by ${admin.name || admin.username}`,
                }
            }));

        await Promise.all([
            prisma.order.updateMany({
                where: { id: { in: orderIds } },
                data: { status }
            }),
            ...historyPromises
        ]);

        return NextResponse.json({ success: true, updatedCount: orders.length });
    } catch (error) {
        console.error('Mobile Orders Bulk Update Error:', error);
        return NextResponse.json({ error: 'Failed to update orders' }, { status: 500 });
    }
}
