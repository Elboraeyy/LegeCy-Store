'use server';

import prisma from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { auditService } from '@/lib/services/auditService';

export interface CustomerFilterParams {
    search?: string;
    page?: number;
    pageSize?: number;
    status?: string;
    minSpend?: number;
    maxSpend?: number;
    tags?: string[];
    sortBy?: 'joinedAt' | 'totalSpend' | 'orders' | 'lastActive';
    sortDir?: 'asc' | 'desc';
}

export interface CustomerProData {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    image: string | null;
    status: string;
    tags: string[];
    notes: string | null;
    joinedAt: Date;
    totalOrders: number;
    totalSpend: number;
    lastOrderDate: Date | null;
}

export async function fetchCustomersPro(params: CustomerFilterParams) {
    await requireAdminPermission(AdminPermissions.USERS.READ);

    const {
        search,
        page = 1,
        pageSize = 10,
        status,
        // minSpend,
        // maxSpend,
        tags,
        sortBy = 'joinedAt',
        sortDir = 'desc'
    } = params;

    const skip = (page - 1) * pageSize;

    // 1. Build Base Filter
    const where: Prisma.UserWhereInput = {};

    if (search) {
        where.OR = [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } }
        ];
    }

    if (status && status !== 'all') {
        where.status = status;
    }

    if (tags && tags.length > 0) {
        where.tags = { hasSome: tags };
    }

    // 2. Fetch Users (Filtering by aggregates like 'totalSpend' requires two steps or raw SQL)
    // For simplicity with Prisma standard API:
    // We will fetch matching users first, then filter by spend if necessary.
    // NOTE: For massive datasets, aggregation filtering should be done via raw query or dedicated analytics table.
    // Here we will rely on pagination limit, but sorting by spend is tricky in standard Prisma without relation ordering.
    // We will use standard sorting for simple fields, and in-memory sort for aggregates if dataset is small, 
    // OR just support simple sorting.

    // Let's implement standard Prisma sorting where possible.
    let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: 'desc' };
    
    if (sortBy === 'joinedAt') {
        orderBy = { createdAt: sortDir };
    } 
    // Note: complex sorting (totalSpend) isn't directly supported in findMany without aggregate grouping.
    // We'll handle 'regular' fetching here.

    const [total, users] = await prisma.$transaction([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            include: {
                _count: { select: { orders: true } },
                orders: {
                    select: { totalPrice: true, createdAt: true }
                }
            },
            orderBy,
            skip,
            take: pageSize,
        })
    ]);

    // 3. Transform and Calculate Aggregates
    const data: CustomerProData[] = users.map(u => {
        const totalSpend = u.orders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
        const lastOrder = u.orders.reduce((latest, o) => o.createdAt > latest ? o.createdAt : latest, new Date(0));
        
        return {
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            image: u.image,
            status: u.status,
            tags: u.tags,
            notes: u.notes,
            joinedAt: u.createdAt,
            totalOrders: u._count.orders,
            totalSpend,
            lastOrderDate: lastOrder.getTime() > 0 ? lastOrder : null
        };
    });

    // Handle Aggregate Filtering/Sorting manually if needed (limited by page size currently)
    // This is a trade-off. For true scalability we'd need a separate stats table or SQL view.
    
    return {
        data,
        total,
        totalPages: Math.ceil(total / pageSize)
    };
}

export async function updateCustomerProfile(id: string, data: { name?: string; phone?: string; status?: string; notes?: string }) {
    const admin = await requireAdminPermission(AdminPermissions.USERS.MANAGE);

    const user = await prisma.user.update({
        where: { id },
        data
    });

    await auditService.logAction(admin.id, 'UPDATE_USER', 'USER', id, { changes: data });
    revalidatePath(`/admin/customers/${id}`);
    revalidatePath('/admin/customers');
    return { success: true, user };
}

export async function addCustomerTag(id: string, tag: string) {
    const admin = await requireAdminPermission(AdminPermissions.USERS.MANAGE);

    const user = await prisma.user.findUnique({ where: { id }, select: { tags: true } });
    if (!user) throw new Error('User not found');

    if (!user.tags.includes(tag)) {
        await prisma.user.update({
            where: { id },
            data: { tags: { push: tag } }
        });
        await auditService.logAction(admin.id, 'ADD_TAG', 'USER', id, { tag });
    }
    
    revalidatePath(`/admin/customers/${id}`);
    return { success: true };
}

export async function removeCustomerTag(id: string, tag: string) {
    const admin = await requireAdminPermission(AdminPermissions.USERS.MANAGE);

    const user = await prisma.user.findUnique({ where: { id }, select: { tags: true } });
    if (!user) throw new Error('User not found');

    const newTags = user.tags.filter(t => t !== tag);
    
    await prisma.user.update({
        where: { id },
        data: { tags: newTags }
    });
    
    await auditService.logAction(admin.id, 'REMOVE_TAG', 'USER', id, { tag });
    revalidatePath(`/admin/customers/${id}`);
    return { success: true };
}

export interface CustomerDetailsPro extends CustomerProData {
    ordersList: {
        id: string;
        createdAt: Date;
        status: string;
        totalPrice: number;
    }[];
    addresses: {
        id: string;
        name: string;
        street: string;
        city: string;
        phone: string;
        type: string;
        isDefault: boolean;
    }[];
}

export async function fetchCustomerDetailsPro(id: string): Promise<CustomerDetailsPro | null> {
    await requireAdminPermission(AdminPermissions.USERS.READ);

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            _count: { select: { orders: true } },
            orders: {
                orderBy: { createdAt: 'desc' },
                take: 10, // Recent 10 orders
                select: {
                    id: true,
                    createdAt: true,
                    status: true,
                    totalPrice: true
                }
            },
            addresses: true
        }
    });

    if (!user) return null;


    
    // Correct total spend calculation
    const agg = await prisma.order.aggregate({
        where: { userId: id },
        _sum: { totalPrice: true }
    });
    const realTotalSpend = Number(agg._sum.totalPrice || 0);

    const lastOrder = user.orders[0]?.createdAt || null;

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        status: user.status,
        tags: user.tags,
        notes: user.notes,
        joinedAt: user.createdAt,
        totalOrders: user._count.orders,
        totalSpend: realTotalSpend,
        lastOrderDate: lastOrder,
        ordersList: user.orders.map(o => ({
            id: o.id,
            createdAt: o.createdAt,
            status: o.status,
            totalPrice: Number(o.totalPrice)
        })),
        addresses: user.addresses.map(a => ({
            id: a.id,
            name: a.name,
            street: a.street,
            city: a.city,
            phone: a.phone,
            type: a.type,
            isDefault: a.isDefault
        }))
    };
}
