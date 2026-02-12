'use server';

import { getOrders } from '@/lib/services/orderService';
import prisma from '@/lib/prisma';
import { OrderStatus } from '@/lib/orderStatus';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';

/**
 * Fetch orders for the admin list.
 * Wraps existing OrderService.getOrders for safety and consistency.
 */
export async function fetchAdminOrders(params: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    search?: string;
    view?: 'all' | 'issues' | 'returns';
    dateRange?: { from: Date; to: Date };
}) {
    // Authorization Check
    await requireAdminPermission(AdminPermissions.ORDERS.READ);

    return await getOrders(params);
}

/**
 * Fetch detailed order information.
 * READ-ONLY Direct Prisma Call.
 */
export async function fetchOrderDetails(orderId: string) {
    // Authorization Check
    await requireAdminPermission(AdminPermissions.ORDERS.READ);

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    variant: {
                        include: {
                            product: true
                        }
                    }
                }
            },
            paymentIntent: true,
            // Fetch events instead of empty history table
            events: {
                orderBy: { createdAt: 'desc' },
                where: {
                    toStatus: { not: null } // Only get status changes
                }
            },
            user: true
        }
    });

    if (!order) return null;

    return {
        ...order,
        status: order.status as OrderStatus,
        createdAt: order.createdAt.toISOString(),
        totalPrice: Number(order.totalPrice),
        subtotal: order.subtotal ? Number(order.subtotal) : null,
        discountAmount: order.discountAmount ? Number(order.discountAmount) : null,
        shippingCost: Number(order.shippingCost || 0),
        firstName: order.firstName,
        lastName: order.lastName,
        alternativePhone: order.alternativePhone,
        paymentPhoneNumber: order.paymentPhoneNumber,
        paymentRef: order.paymentRef,
        shippingNotes: order.shippingNotes,
        paymentIntent: order.paymentIntent ? {
            ...order.paymentIntent,
            amount: Number(order.paymentIntent.amount),
            expiresAt: order.paymentIntent.expiresAt.toISOString(),
            createdAt: order.paymentIntent.createdAt.toISOString(),
        } : null,
        items: order.items.map(item => ({
            ...item,
            price: Number(item.price),
            discountedPrice: item.discountedPrice ? Number(item.discountedPrice) : null,
            costAtPurchase: item.costAtPurchase ? Number(item.costAtPurchase) : null,
            variant: item.variant ? {
                id: item.variant.id,
                sku: item.variant.sku,
                price: Number(item.variant.price),
                productId: item.variant.productId,
                productName: item.variant.product.name,
            } : null
        })),
        // Map events to the expected history structure
        history: order.events.map(e => ({
            id: e.id,
            to: e.toStatus!, // Guaranteed by where clause
            from: e.fromStatus,
            reason: e.reason,
            actor: e.triggeredBy,
            createdAt: e.createdAt.toISOString()
        }))
    };
}

/**
 * Fetch Order Statistics for the Dashboard
 */
export async function fetchOrderStats() {
    await requireAdminPermission(AdminPermissions.ORDERS.READ);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
        totalOrders,
        pendingOrders,
        deliveredOrders,
        monthlyRevenue,
        recentOrders
    ] = await Promise.all([
        prisma.order.count({ where: { status: { not: 'cancelled' } } }),
        prisma.order.count({ where: { status: 'pending' } }),
        prisma.order.count({ where: { status: 'delivered' } }),
        prisma.order.aggregate({
            _sum: { totalPrice: true, shippingCost: true },
            where: {
                createdAt: { gte: firstDayOfMonth },
                status: { notIn: ['cancelled'] }
            }
        }),
        prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, createdAt: true, status: true, totalPrice: true, user: { select: { name: true } } }
        })
    ]);

    return {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        monthlyRevenue: Number(monthlyRevenue._sum.totalPrice || 0) - Number(monthlyRevenue._sum.shippingCost || 0),
        recentOrders: recentOrders.map(o => ({
            ...o,
            totalPrice: Number(o.totalPrice),
            createdAt: o.createdAt.toISOString(),
            status: o.status as OrderStatus
        }))
    };
}
