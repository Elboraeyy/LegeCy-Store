'use server';

import prisma from '@/lib/prisma';
import { OrderStatus } from '@/lib/orderStatus';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';

/**
 * Fetch orders with failed or pending payments.
 * These are separate from regular orders.
 */
export async function fetchFailedPaymentOrders() {
    await requireAdminPermission(AdminPermissions.ORDERS.READ);

    const orders = await prisma.order.findMany({
        where: {
            status: { in: [OrderStatus.PaymentPending, OrderStatus.PaymentFailed] }
        },
        orderBy: { createdAt: 'desc' },
        include: {
            items: true,
            user: { select: { name: true, email: true } }
        }
    });

    return orders.map(order => ({
        id: order.id,
        status: order.status as string,
        totalPrice: Number(order.totalPrice),
        createdAt: order.createdAt.toISOString(),
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        paymentMethod: order.paymentMethod,
        user: order.user ? { name: order.user.name, email: order.user.email } : null,
        items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: Number(item.price)
        }))
    }));
}
