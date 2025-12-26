'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';
import { auditService } from '@/lib/services/auditService';

export interface CategoryInput {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    sortOrder?: number;
}

export async function fetchAllCategories() {
    const categories = await prisma.category.findMany({
        orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
        include: {
            _count: { select: { products: true } },
            parent: { select: { name: true } }
        }
    });
    
    return categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        parentId: c.parentId,
        parentName: c.parent?.name || null,
        productCount: c._count.products,
        sortOrder: c.sortOrder,
        createdAt: c.createdAt.toISOString()
    }));
}

export async function createCategoryAction(data: CategoryInput) {
    const admin = await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

    const category = await prisma.category.create({
        data: {
            name: data.name,
            slug: data.slug.toLowerCase().replace(/\s+/g, '-'),
            description: data.description,
            parentId: data.parentId || null,
            sortOrder: data.sortOrder || 0
        }
    });

    await auditService.logAction(admin.id, 'CREATE_CATEGORY', 'CATEGORY', category.id, { name: data.name });

    revalidatePath('/admin/categories');
    return category;
}

export async function updateCategoryAction(id: string, data: CategoryInput) {
    const admin = await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

    await prisma.category.update({
        where: { id },
        data: {
            name: data.name,
            slug: data.slug.toLowerCase().replace(/\s+/g, '-'),
            description: data.description,
            parentId: data.parentId || null,
            sortOrder: data.sortOrder || 0
        }
    });

    await auditService.logAction(admin.id, 'UPDATE_CATEGORY', 'CATEGORY', id, { changes: data });

    revalidatePath('/admin/categories');
}

export async function deleteCategoryAction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const admin = await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

        // Check if category has products
        const productCount = await prisma.product.count({ where: { categoryId: id } });
        if (productCount > 0) {
            return { success: false, error: `Cannot delete: ${productCount} products are using this category.` };
        }

        // Check for child categories
        const childCount = await prisma.category.count({ where: { parentId: id } });
        if (childCount > 0) {
            return { success: false, error: `Cannot delete: This category has ${childCount} sub-categories.` };
        }

        await prisma.category.delete({ where: { id } });

        await auditService.logAction(admin.id, 'DELETE_CATEGORY', 'CATEGORY', id);

        revalidatePath('/admin/categories');
        return { success: true };
    } catch (error) {
        console.error("Delete Category Error:", error);
        return { success: false, error: "Failed to delete category." };
    }
}
