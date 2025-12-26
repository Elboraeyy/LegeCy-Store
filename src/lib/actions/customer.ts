'use server';

import prisma from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';
import { Prisma } from '@prisma/client';

export interface CustomerSummary {
    id: string;
    name: string | null;
    email: string;
    joinedAt: string;
    totalOrders: number;
    totalSpend: number;
    lastOrderDate: string | null;
}

export async function fetchCustomers(params: {
    page?: number;
    limit?: number;
    pageSize?: number;
    search?: string;
}): Promise<{ data: CustomerSummary[]; total: number; totalPages: number }> {
    await requireAdminPermission(AdminPermissions.USERS.READ);

    const page = params.page || 1;
    const limit = params.pageSize || params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    if (params.search) {
        where.OR = [
            { email: { contains: params.search } },
            { name: { contains: params.search } }
        ];
    }

    const [total, users] = await prisma.$transaction([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            include: {
                orders: {
                    select: {
                        totalPrice: true,
                        createdAt: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        })
    ]);

    const data = users.map(user => {
        const totalSpend = user.orders.reduce((sum, order) => sum + Number(order.totalPrice), 0);
        const lastOrder = user.orders.length > 0 
            ? user.orders.reduce((latest, order) => order.createdAt > latest ? order.createdAt : latest, new Date(0)) 
            : null;

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            joinedAt: user.createdAt.toISOString(),
            totalOrders: user.orders.length,
            totalSpend,
            lastOrderDate: lastOrder && lastOrder.getTime() > 0 ? lastOrder.toISOString() : null
        };
    });

    return {
        data,
        total,
        totalPages: Math.ceil(total / limit)
    };
}

export async function fetchCustomerDetails(id: string) {
    await requireAdminPermission(AdminPermissions.USERS.READ);

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            orders: {
                orderBy: { createdAt: 'desc' },
                include: {
                    items: true
                }
            }
        }
    });

    if (!user) return null;

    const totalSpend = user.orders.reduce((sum, order) => sum + Number(order.totalPrice), 0);
    
    return {
        ...user,
        createdAt: user.createdAt.toISOString(),
        totalSpend,
        orders: user.orders.map(o => ({
            ...o,
            totalPrice: Number(o.totalPrice),
            createdAt: o.createdAt.toISOString()
        }))
    };
}
