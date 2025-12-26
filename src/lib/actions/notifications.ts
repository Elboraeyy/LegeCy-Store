'use server';

import prisma from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';

export interface NotificationItem {
    id: string;
    type: 'order' | 'stock' | 'system';
    title: string;
    message: string;
    link?: string;
    createdAt: string;
}

export async function getNotifications(): Promise<{
    items: NotificationItem[];
    counts: {
        pendingOrders: number;
        lowStock: number;
        total: number;
    };
}> {
    await requireAdminPermission(AdminPermissions.ORDERS.READ);

    const [pendingOrders, lowStockItems, recentOrders] = await prisma.$transaction([
        // Count pending orders
        prisma.order.count({
            where: { status: 'pending' }
        }),
        // Count low stock items
        prisma.inventory.count({
            where: { available: { lt: 5 } }
        }),
        // Get recent pending orders for notification items
        prisma.order.findMany({
            where: { status: 'pending' },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                totalPrice: true,
                createdAt: true,
                user: { select: { name: true, email: true } }
            }
        })
    ]);

    const items: NotificationItem[] = [];

    // Add pending order notifications
    recentOrders.forEach(order => {
        items.push({
            id: `order-${order.id}`,
            type: 'order',
            title: 'New Order',
            message: `Order from ${order.user?.name || order.user?.email || 'Guest'} - EGP ${Number(order.totalPrice).toLocaleString()}`,
            link: `/admin/orders/${order.id}`,
            createdAt: order.createdAt.toISOString()
        });
    });

    // Add low stock notification if any
    if (lowStockItems > 0) {
        items.unshift({
            id: 'stock-alert',
            type: 'stock',
            title: 'Low Stock Alert',
            message: `${lowStockItems} items are running low on stock`,
            link: '/admin/products?stock=low_stock',
            createdAt: new Date().toISOString()
        });
    }

    return {
        items,
        counts: {
            pendingOrders,
            lowStock: lowStockItems,
            total: pendingOrders + (lowStockItems > 0 ? 1 : 0)
        }
    };
}
