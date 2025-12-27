'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';
import { auditService } from '@/lib/services/auditService';

export interface BrandInput {
    name: string;
    slug: string;
    imageUrl?: string;
}

export async function fetchAllBrands() {
    return await prisma.brand.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: { select: { products: true } }
        }
    });
}

export async function createBrandAction(data: BrandInput) {
    const admin = await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

    const brand = await prisma.brand.create({
        data: {
            name: data.name,
            slug: data.slug.toLowerCase().replace(/\s+/g, '-'),
            imageUrl: data.imageUrl
        }
    });

    await auditService.logAction(admin.id, 'CREATE_BRAND', 'BRAND', brand.id, { name: data.name });
    revalidatePath('/', 'layout');
    return brand;
}

export async function updateBrandAction(id: string, data: BrandInput) {
    const admin = await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

    await prisma.brand.update({
        where: { id },
        data: {
            name: data.name,
            slug: data.slug.toLowerCase().replace(/\s+/g, '-'),
            imageUrl: data.imageUrl
        }
    });

    await auditService.logAction(admin.id, 'UPDATE_BRAND', 'BRAND', id, { changes: data });
    revalidatePath('/', 'layout');
}

export async function deleteBrandAction(id: string) {
    const admin = await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

    // Check for products
    const count = await prisma.product.count({ where: { brandId: id } });
    if (count > 0) {
        return { success: false, error: `Cannot delete: used by ${count} products.` };
    }

    await prisma.brand.delete({ where: { id } });
    await auditService.logAction(admin.id, 'DELETE_BRAND', 'BRAND', id);
    revalidatePath('/', 'layout');
    return { success: true };
}
