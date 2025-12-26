'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Decimal } from '@prisma/client/runtime/library';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';
import { getDefaultWarehouseId } from '@/lib/services/orderService'; // Reusing helper

export interface ProductInput {
    name: string;
    description?: string;
    price: number;
    compareAtPrice?: number;
    sku: string;
    imageUrl?: string; 
    gallery?: string[]; 
    stock?: number;
    status?: string;
    categoryId?: string;
}

// Fetch categories for dropdown
export async function fetchCategories(): Promise<{ id: string; name: string }[]> {
    const categories = await prisma.category.findMany({
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true }
    });
    return categories;
}

import { auditService } from '@/lib/services/auditService';

export async function createProductAction(data: ProductInput) {
    // 1. Auth Guard
    const admin = await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

    // 2. Create Product (Transaction for safety)
    const product = await prisma.$transaction(async (tx) => {
        const p = await tx.product.create({
            data: {
                name: data.name,
                description: data.description,
                imageUrl: data.imageUrl,
                compareAtPrice: data.compareAtPrice ? new Decimal(data.compareAtPrice) : null,
                status: data.status || 'active',
                categoryId: data.categoryId || null,
                images: {
                    create: data.gallery?.map(url => ({ url })) || []
                }
            }
        });

        // 3. Create Default Variant
        const v = await tx.variant.create({
            data: {
                productId: p.id,
                sku: data.sku,
                price: new Decimal(data.price),
            }
        });

        // 4. Initialize Inventory (Critical)
        // We need a default warehouse.
        const warehouseId = await getDefaultWarehouseId(tx);
        
        await tx.inventory.create({
            data: {
                warehouseId,
                variantId: v.id,
                available: data.stock || 0,
                reserved: 0
            }
        });

        return p;
    });

    // Audit Log (After transaction commit)
    await auditService.logAction(
        admin.id,
        'CREATE_PRODUCT',
        'PRODUCT',
        product.id,
        { name: data.name, sku: data.sku, initialStock: data.stock }
    );

    revalidatePath('/admin/products');
    redirect('/admin/products');
}

export async function updateProductAction(id: string, data: ProductInput) {
    const admin = await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

    // 1. Update Product Basic Info
    await prisma.product.update({
        where: { id },
        data: {
            name: data.name,
            description: data.description,
            imageUrl: data.imageUrl,
            images: {
                deleteMany: {},
                create: data.gallery?.map(url => ({ url })) || []
            }
        }
    });

    // 2. Update Default Variant
    const firstVariant = await prisma.variant.findFirst({ where: { productId: id } });
    if (firstVariant) {
        await prisma.variant.update({
            where: { id: firstVariant.id },
            data: {
                sku: data.sku,
                price: new Decimal(data.price),
            }
        });
        
        // 3. Update Inventory if stock provided
        if (data.stock !== undefined && data.stock !== null) {
            const newStock = data.stock;
            await prisma.$transaction(async (tx) => {
                const warehouseId = await getDefaultWarehouseId(tx);
                
                await tx.inventory.upsert({
                    where: {
                        warehouseId_variantId: {
                            warehouseId,
                            variantId: firstVariant.id
                        }
                    },
                    update: {
                        available: newStock,
                    },
                    create: {
                        warehouseId,
                        variantId: firstVariant.id,
                        available: newStock,
                        reserved: 0
                    }
                });
            });
        }
    }

    // Audit Log
    await auditService.logAction(
        admin.id,
        'UPDATE_PRODUCT',
        'PRODUCT',
        id,
        { changes: data }
    );

    revalidatePath('/admin/products');
    redirect('/admin/products');
}

export async function deleteProductAction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const admin = await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

        // 1. Get all variants to check dependencies
        const variants = await prisma.variant.findMany({
            where: { productId: id },
            select: { id: true }
        });
        const variantIds = variants.map(v => v.id);

        // 2. Check for existing orders
        const hasOrders = await prisma.orderItem.findFirst({
            where: { variantId: { in: variantIds } }
        });

        if (hasOrders) {
            return { 
                success: false, 
                error: "Cannot delete product: It has been ordered by customers. Archiving is recommended preventing data loss." 
            };
        }

        // 3. Perform Cascade Delete
        await prisma.$transaction(async (tx) => {
            await tx.inventory.deleteMany({ where: { variantId: { in: variantIds } } });
            await tx.cartItem.deleteMany({ where: { variantId: { in: variantIds } } });
            await tx.variant.deleteMany({ where: { productId: id } });
            await tx.product.delete({ where: { id } });
        });

        // Audit Log
        await auditService.logAction(admin.id, 'DELETE_PRODUCT', 'PRODUCT', id);

        revalidatePath('/admin/products');
        return { success: true };
    } catch (error) {
        console.error("Delete Product Error:", error);
        return { success: false, error: "System error: Failed to delete product." };
    }
}
