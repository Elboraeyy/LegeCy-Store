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
    detailedDescription?: string;
    price: number;
    compareAtPrice?: number;
    sku: string;
    imageUrl?: string; 
    gallery?: string[]; 
    stock?: number;
    status?: string;
    categoryId?: string;
    brandId?: string;
    materialId?: string;
    warehouseId?: string;
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
                detailedDescription: data.detailedDescription,
                imageUrl: data.imageUrl,
                compareAtPrice: data.compareAtPrice ? new Decimal(data.compareAtPrice) : null,
                status: data.status || 'active',
                categoryId: data.categoryId || null,
                brandId: data.brandId || null,
                materialId: data.materialId || null,
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
        // Use provided warehouse or default
        const warehouseId = data.warehouseId || await getDefaultWarehouseId(tx);
        
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
            detailedDescription: data.detailedDescription,
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

        // 2.1 Track Price History if changed
        if (firstVariant.price && !firstVariant.price.equals(new Decimal(data.price))) {
            await prisma.productPriceHistory.create({
                data: {
                    productId: id,
                    variantId: firstVariant.id,
                    oldPrice: firstVariant.price,
                    newPrice: new Decimal(data.price),
                    changedBy: admin.id,
                    reason: 'Admin product update'
                }
            });
        }
        
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

        // 3. Check for POS transactions
        const hasPOSTransactions = await prisma.pOSTransactionItem.findFirst({
            where: { variantId: { in: variantIds } }
        });

        if (hasPOSTransactions) {
            return { 
                success: false, 
                error: "Cannot delete product: It has POS transaction history. Archiving is recommended." 
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

// ========== Dashboard Stats ==========

export type ProductStats = {
    totalProducts: number;
    activeProducts: number;
    draftProducts: number;
    archivedProducts: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    categories: { id: string; name: string; count: number }[];
};

export async function fetchProductStats(): Promise<ProductStats> {
    try {
        const [
            totalProducts,
            activeProducts,
            draftProducts,
            archivedProducts,
            products,
            categories
        ] = await prisma.$transaction([
            prisma.product.count(),
            prisma.product.count({ where: { status: 'active' } }),
            prisma.product.count({ where: { status: 'draft' } }),
            prisma.product.count({ where: { status: 'archived' } }),
            prisma.product.findMany({
                include: {
                    variants: {
                        include: { inventory: true }
                    }
                }
            }),
            prisma.category.findMany({
                select: { id: true, name: true, _count: { select: { products: true } } }
            })
        ]);

        // Calculate stock value and alerts
        let totalStockValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        for (const product of products) {
            let productStock = 0;
            for (const variant of product.variants) {
                const price = Number(variant.price);
                for (const inv of variant.inventory) {
                    totalStockValue += price * inv.available;
                    productStock += inv.available;
                }
            }
            if (productStock === 0) outOfStockCount++;
            else if (productStock < 10) lowStockCount++;
        }

        return {
            totalProducts,
            activeProducts,
            draftProducts,
            archivedProducts,
            totalStockValue: Math.round(totalStockValue),
            lowStockCount,
            outOfStockCount,
            categories: categories.map(c => ({
                id: c.id,
                name: c.name,
                count: c._count.products
            }))
        };
    } catch (error) {
        console.error('Failed to fetch product stats:', error);
        return {
            totalProducts: 0,
            activeProducts: 0,
            draftProducts: 0,
            archivedProducts: 0,
            totalStockValue: 0,
            lowStockCount: 0,
            outOfStockCount: 0,
            categories: []
        };
    }
}

// ========== Bulk Actions ==========

export async function bulkDeleteProducts(ids: string[]): Promise<{ success: boolean; deleted: number; errors: string[] }> {
    const admin = await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);
    const errors: string[] = [];
    let deleted = 0;

    for (const id of ids) {
        const result = await deleteProductAction(id);
        if (result.success) deleted++;
        else errors.push(`${id}: ${result.error}`);
    }

    await auditService.logAction(admin.id, 'BULK_DELETE_PRODUCTS', 'PRODUCT', null, { count: deleted });
    revalidatePath('/admin/products');

    return { success: errors.length === 0, deleted, errors };
}

export async function bulkUpdateStatus(ids: string[], status: string): Promise<{ success: boolean; updated: number }> {
    const admin = await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

    const result = await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { status }
    });

    await auditService.logAction(admin.id, 'BULK_UPDATE_STATUS', 'PRODUCT', null, { ids, status });
    revalidatePath('/admin/products');

    return { success: true, updated: result.count };
}

export async function duplicateProduct(id: string): Promise<{ success: boolean; newId?: string; error?: string }> {
    try {
        const admin = await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

        const original = await prisma.product.findUnique({
            where: { id },
            include: {
                variants: true,
                images: true
            }
        });

        if (!original) return { success: false, error: 'Product not found' };

        const newProduct = await prisma.$transaction(async (tx) => {
            const p = await tx.product.create({
                data: {
                    name: `${original.name} (Copy)`,
                    description: original.description,
                    detailedDescription: original.detailedDescription,
                    imageUrl: original.imageUrl,
                    compareAtPrice: original.compareAtPrice,
                    status: 'draft',
                    categoryId: original.categoryId,
                    brandId: original.brandId,
                    materialId: original.materialId,
                    images: {
                        create: original.images.map(img => ({ url: img.url }))
                    }
                }
            });

            for (const variant of original.variants) {
                const v = await tx.variant.create({
                    data: {
                        productId: p.id,
                        sku: `${variant.sku}-COPY`,
                        price: variant.price
                    }
                });

                const warehouseId = await getDefaultWarehouseId(tx);
                await tx.inventory.create({
                    data: {
                        warehouseId,
                        variantId: v.id,
                        available: 0,
                        reserved: 0
                    }
                });
            }

            return p;
        });

        await auditService.logAction(admin.id, 'DUPLICATE_PRODUCT', 'PRODUCT', newProduct.id, { originalId: id });
        revalidatePath('/admin/products');

        return { success: true, newId: newProduct.id };
    } catch (error) {
        console.error('Failed to duplicate product:', error);
        return { success: false, error: 'Failed to duplicate product' };
    }
}

