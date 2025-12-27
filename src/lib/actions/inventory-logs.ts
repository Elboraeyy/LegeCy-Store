'use server';

import prismaClient from '@/lib/prisma';
import { validateAdminSession } from '@/lib/auth/session';
import { Prisma } from '@prisma/client';

const prisma = prismaClient!;

export type InventoryLogEntry = {
    id: string;
    action: string;
    quantity: number;
    balanceAfter: number | null;
    reason: string | null;
    createdAt: Date;
    adminName: string;
    warehouseName: string;
    variantSku: string;
    productName: string;
};

export type InventoryLogsResponse = {
    data: InventoryLogEntry[];
    meta: {
        total: number;
        pages: number;
        currentPage: number;
    };
};

export async function fetchInventoryLogs(
    variantId?: string, 
    page: number = 1, 
    limit: number = 20
): Promise<InventoryLogsResponse | { error: string }> {
    try {
        await validateAdminSession();

        const skip = (page - 1) * limit;

        const whereClause: Prisma.InventoryLogWhereInput = {};
        if (variantId) {
            whereClause.variantId = variantId;
        }

        const [logs, total] = await prisma.$transaction([
            prisma.inventoryLog.findMany({
                where: whereClause,
                include: {
                    admin: { select: { name: true, email: true } },
                    warehouse: { select: { name: true } },
                    variant: {
                        include: {
                            product: { select: { name: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.inventoryLog.count({ where: whereClause })
        ]);

        const formattedLogs: InventoryLogEntry[] = logs.map(log => ({
            id: log.id,
            action: log.action,
            quantity: log.quantity,
            balanceAfter: log.balanceAfter,
            reason: log.reason,
            createdAt: log.createdAt,
            adminName: log.admin?.name || log.admin?.email || 'System',
            warehouseName: log.warehouse.name,
            variantSku: log.variant.sku,
            productName: log.variant.product.name
        }));

        return {
            data: formattedLogs,
            meta: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page
            }
        };

    } catch (error) {
        console.error('Error fetching inventory logs:', error);
        return { error: 'Failed to fetch inventory logs' };
    }
}
