import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: Request) {
    try {
        const { requireAdminPermission } = await import('@/lib/auth/guards');
        const { AdminPermissions } = await import('@/lib/auth/permissions');

        await requireAdminPermission(AdminPermissions.INVENTORY.MANAGE);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;
        const warehouseId = searchParams.get('warehouseId') || undefined;

        const where = warehouseId ? { warehouseId } : {};

        const [total, inventory] = await prisma.$transaction([
            prisma.inventory.count({ where }),
            prisma.inventory.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                include: {
                    variant: {
                        include: {
                            product: {
                                select: { name: true }
                            }
                        }
                    },
                    warehouse: {
                        select: { name: true }
                    }
                }
            })
        ]);

        const data = inventory.map(inv => ({
            id: inv.id,
            sku: inv.variant.sku,
            productName: inv.variant.product.name,
            available: inv.available,
            reserved: inv.reserved,
            warehouseId: inv.warehouseId,
            warehouseName: inv.warehouse.name,
            variantId: inv.variantId,
            updatedAt: inv.updatedAt.toISOString(),
        }));

        return NextResponse.json({
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        return handleApiError(error);
    }
}
