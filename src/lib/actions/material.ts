'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';
import { auditService } from '@/lib/services/auditService';

export interface MaterialInput {
    name: string;
    slug: string;
}

export async function fetchAllMaterials() {
    return await prisma.material.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: { select: { products: true } }
        }
    });
}

export async function createMaterialAction(data: MaterialInput) {
    const admin = await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

    const material = await prisma.material.create({
        data: {
            name: data.name,
            slug: data.slug.toLowerCase().replace(/\s+/g, '-'),
        }
    });

    await auditService.logAction(admin.id, 'CREATE_MATERIAL', 'MATERIAL', material.id, { name: data.name });
    revalidatePath('/', 'layout');
    return material;
}

export async function updateMaterialAction(id: string, data: MaterialInput) {
    const admin = await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

    await prisma.material.update({
        where: { id },
        data: {
            name: data.name,
            slug: data.slug.toLowerCase().replace(/\s+/g, '-'),
        }
    });

    await auditService.logAction(admin.id, 'UPDATE_MATERIAL', 'MATERIAL', id, { changes: data });
    revalidatePath('/', 'layout');
}

export async function deleteMaterialAction(id: string) {
    const admin = await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

    // Check for products
    const count = await prisma.product.count({ where: { materialId: id } });
    if (count > 0) {
        return { success: false, error: `Cannot delete: used by ${count} products.` };
    }

    await prisma.material.delete({ where: { id } });
    await auditService.logAction(admin.id, 'DELETE_MATERIAL', 'MATERIAL', id);
    revalidatePath('/', 'layout');
    return { success: true };
}
