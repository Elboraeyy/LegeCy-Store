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
            history: {
                orderBy: { createdAt: 'desc' }
            },
            user: true
        }
    });

    if (!order) return null;

    return {
        ...order,
        status: order.status as OrderStatus,
        createdAt: order.createdAt.toISOString(),
        totalPrice: Number(order.totalPrice), // Convert Decimal to number
        paymentIntent: order.paymentIntent ? {
            ...order.paymentIntent,
            amount: Number(order.paymentIntent.amount), // Convert Decimal to number
            expiresAt: order.paymentIntent.expiresAt.toISOString(),
            createdAt: order.paymentIntent.createdAt.toISOString(),
        } : null,
        items: order.items.map(item => ({
            ...item,
            price: Number(item.price), // Convert Decimal to number
            discountedPrice: item.discountedPrice ? Number(item.discountedPrice) : null, // Convert Decimal to number
            variant: item.variant ? {
                id: item.variant.id,
                sku: item.variant.sku,
                price: Number(item.variant.price), // Convert Decimal to number
                productId: item.variant.productId,
                productName: item.variant.product.name, // Convenience
                // Do NOT include full product object as it contains Decimals (compareAtPrice)
            } : null
        })),
        history: order.history.map(h => ({
            ...h,
            createdAt: h.createdAt.toISOString()
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
        failedPayments,
        monthlyRevenue,
        recentOrders
    ] = await Promise.all([
        prisma.order.count({
            where: { status: { notIn: ['payment_pending', 'payment_failed'] } }
        }),
        prisma.order.count({ where: { status: 'pending' } }),
        prisma.order.count({ 
            where: { status: { in: ['payment_pending', 'payment_failed'] } } 
        }),
        prisma.order.aggregate({
            _sum: { totalPrice: true },
            where: {
                createdAt: { gte: firstDayOfMonth },
                status: { notIn: ['cancelled', 'payment_pending', 'payment_failed'] }
            }
        }),
        prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            where: { status: { notIn: ['payment_pending', 'payment_failed'] } },
            select: { id: true, createdAt: true, status: true, totalPrice: true, user: { select: { name: true } } }
        })
    ]);

    return {
        totalOrders,
        pendingOrders,
        failedPayments,
        monthlyRevenue: Number(monthlyRevenue._sum.totalPrice || 0),
        recentOrders: recentOrders.map(o => ({
            ...o,
            totalPrice: Number(o.totalPrice),
            createdAt: o.createdAt.toISOString(),
            status: o.status as OrderStatus
        }))
    };
}
