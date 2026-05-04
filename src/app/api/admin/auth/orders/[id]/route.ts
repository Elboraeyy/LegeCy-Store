import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/auth/orders/[id]
 * Full order details with items, customer, history
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await params;
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: { select: { id: true, name: true, imageUrl: true, nameAr: true } },
                    },
                },
                user: { select: { id: true, name: true, email: true, phone: true } },
                history: { orderBy: { createdAt: 'desc' } },
                notes: { orderBy: { createdAt: 'desc' } },
                returnRequest: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...order,
            totalPrice: order.totalPrice.toNumber(),
            subtotal: order.subtotal?.toNumber() || 0,
            shippingCost: order.shippingCost?.toNumber() || 0,
            discountAmount: order.discountAmount?.toNumber() || 0,
            displayName: order.customerName || `${order.firstName || ''} ${order.lastName || ''}`.trim() || 'Guest',
            items: order.items.map(item => ({
                ...item,
                price: item.price.toNumber(),
                discountedPrice: item.discountedPrice?.toNumber(),
            })),
        });
    } catch (error) {
        console.error('Mobile Order Detail Error:', error);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/auth/orders/[id]
 * Update order status or notes
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await params;
        const body = await request.json();
        const { status, note, customer, items, shippingAddress } = body;

        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Check if this is a manual order update (from mobile/admin edit)
        if (customer || items || shippingAddress) {
            const { adminUpdateOrder } = await import('@/lib/actions/order');
            const result = await adminUpdateOrder(id, {
                customer,
                items,
                shippingAddress,
                shippingCost: body.shippingCost,
                discountAmount: body.discountAmount,
                paymentMethod: body.paymentMethod,
                source: body.source,
                notes: body.notes || note,
                status: status,
                adminId: admin.id,
                skipAuthCheck: true
            });

            if (!result.success) {
                return NextResponse.json({ error: result.error || 'Failed to update order' }, { status: 400 });
            }
            
            return NextResponse.json({ success: true, status: status || order.status });
        }

        const updates: Record<string, unknown> = {};

        // Update status
        if (status && status !== order.status) {
            // Record status history
            await prisma.orderStatusHistory.create({
                data: {
                    orderId: id,
                    from: order.status,
                    to: status,
                    reason: `Updated via mobile app by ${admin.name || admin.username}`,
                },
            });

            updates.status = status;

            if (status === 'delivered') {
                updates.deliveredAt = new Date();
            }
        }

        // Add note
        if (note) {
            await prisma.orderNote.create({
                data: {
                    orderId: id,
                    content: note,
                    adminId: admin.id,
                },
            });
        }

        if (Object.keys(updates).length > 0) {
            await prisma.order.update({ where: { id }, data: updates });
        }

        return NextResponse.json({ success: true, status: status || order.status });
    } catch (error) {
        console.error('Mobile Order Update Error:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
