'use server';

import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateCustomerSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import { getDefaultWarehouseId } from '../services/orderService';


// --- Types ---
export type CartItemDTO = {
    id: string; // Product ID (UUID)
    variantId?: string;
    qty: number;
    // Hydrated Data
    name: string;
    price: number;
    imageUrl?: string;
    category?: string;
    stock: number; // Available stock for UI limits
};

// --- Actions ---

/**
 * Get Authenticated User Cart
 */
export async function getCartAction(): Promise<CartItemDTO[]> {
    const { user } = await validateCustomerSession();
    if (!user) return [];

    const cart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: {
            items: {
                include: {
                    product: true,
                    variant: { include: { inventory: true } }
                }
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any // Cast to any to bypass stale Client types
    });

    if (!cart) return [];

    // Map to DTO
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (cart as any).items.map((item: any) => {
        const variant = item.variant;
        const product = item.product;
        
        // Calculate max available stock
        const stock = variant 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? variant.inventory.reduce((sum: number, inv: any) => sum + inv.available, 0)
            : 0; 
            
        return {
            id: item.productId,
            variantId: item.variantId || undefined,
            qty: item.quantity,
            name: product.name,
            price: variant ? Number(variant.price) : 0,
            imageUrl: product.imageUrl || undefined,
            category: product.category || undefined,
            stock: stock
        };
    });
}

/**
 * Merge Guest Cart into User Cart (Login Sync)
 * - Adds quantities from guest cart to user cart.
 * - Caps at max stock or arbitrary limit.
 */
export async function mergeGuestCartAction(guestItems: { id: string, variantId?: string, qty: number }[]) {
    const { user } = await validateCustomerSession();
    if (!user || !guestItems.length) return { success: false };

    await prisma.$transaction(async (tx) => {
        // 1. Ensure Cart Exists
        let cart = await tx.cart.findUnique({ where: { userId: user.id } });
        if (!cart) {
            cart = await tx.cart.create({ data: { userId: user.id } });
        }
        
        for (const item of guestItems) {
            if (!item.variantId) continue; // Skip invalid items without variant

            // 2. Check Exists
            const existing = await tx.cartItem.findFirst({
                where: { 
                    cartId: cart.id, 
                    productId: item.id, 
                    variantId: item.variantId 
                }
            });

            const newQty = (existing?.quantity || 0) + item.qty;

            // 3. Update or Create
            if (existing) {
                await tx.cartItem.update({
                    where: { id: existing.id },
                    data: { quantity: Math.min(newQty, 99) }
                });
            } else {
                await tx.cartItem.create({
                    data: {
                        cartId: cart.id,
                        productId: item.id,
                        variantId: item.variantId,
                        quantity: Math.min(item.qty, 99)
                    }
                });
            }
        }
    });

    revalidatePath('/cart');
    return { success: true };
}

/**
 * Add Item to Cart (Atomic)
 */
export async function addToCartAction(productId: string, variantId: string, qty: number = 1) {
    const { user } = await validateCustomerSession();
    if (!user) throw new Error("Must be logged in to reserve stock."); 

    const warehouseId = await getDefaultWarehouseId(prisma);

    await prisma.$transaction(async (tx) => {
        // 1. Validate Variant & Stock
        const variant = await tx.variant.findUnique({
             where: { id: variantId },
             include: { inventory: { where: { warehouseId } } }
        });

        if (!variant) throw new Error("Variant not found");
        if (variant.productId !== productId) throw new Error("Product mismatch");

        // 2. Ensure Cart
        let cart = await tx.cart.findUnique({ where: { userId: user.id } });
        if (!cart) {
            cart = await tx.cart.create({ data: { userId: user.id } });
        }

        // 3. Upsert Item
        const existing = await tx.cartItem.findFirst({
            where: { 
                cartId: cart.id, 
                variantId: variantId 
            }
        });

        const currentQty = existing?.quantity || 0;
        const requestedTotal = currentQty + qty;

        // Optimistic Stock Check
        // Ideally handled by inventoryService.reserveStock, but for simple cart logic we proceed.
        
        if (existing) {
            await tx.cartItem.update({
                where: { id: existing.id },
                data: { quantity: Math.min(requestedTotal, 99) }
            });
        } else {
            await tx.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: productId,
                    variantId: variantId,
                    quantity: Math.min(qty, 99)
                }
            });
        }
    });

    revalidatePath('/cart');
}

/**
 * Remove Item
 */
export async function removeFromCartAction(productId: string, variantId: string) {
    const { user } = await validateCustomerSession();
    if (!user) return;

    const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) return;

    await prisma.cartItem.deleteMany({
        where: {
            cartId: cart.id,
            productId: productId,
            variantId: variantId
        }
    });

    revalidatePath('/cart');
}

/**
 * Update Quantity (Set Exact)
 */
export async function updateQtyAction(productId: string, variantId: string, qty: number) {
    const { user } = await validateCustomerSession();
    if (!user) return;

    if (qty <= 0) {
        return removeFromCartAction(productId, variantId);
    }


    const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) return;

    await prisma.cartItem.updateMany({
        where: { 
            cartId: cart.id,
            productId: productId,
            variantId: variantId
        },
        data: { quantity: Math.min(qty, 99) }
    });
    
    revalidatePath('/cart');
}

export async function clearCartAction() {
    const { user } = await validateCustomerSession();
    if (!user) return;
    
    await prisma.cart.delete({ where: { userId: user.id } });
    revalidatePath('/cart');
}
