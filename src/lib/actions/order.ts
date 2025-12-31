'use server';

import { updateOrderStatus, createOrder } from '@/lib/services/orderService';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';
import { revalidatePath } from 'next/cache';
import { OrderStatus } from '@/lib/orderStatus';
import { Order } from '@/types/order';

export type StatusUpdateResult = {
    success: boolean;
    error?: string;
};

export async function updateOrderStatusAction(
    orderId: string, 
    newStatus: OrderStatus
    // reason?: string // TODO: Pass to service when supported
): Promise<StatusUpdateResult> {
    try {
        const admin = await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);
        
        await updateOrderStatus(
            orderId, 
            newStatus, 
            'admin', 
            admin.id
        );

        revalidatePath(`/admin/orders/${orderId}`);
        revalidatePath('/admin/orders');
        return { success: true };
    } catch (error) {
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Unknown system error occurred.' };
    }
}

// ==========================================
// STOREFRONT ACTIONS
// ==========================================

interface CartItemInput {
    id: string; // product ID
    name: string;
    price: number;
    qty: number;
    variantId: string | null;
}

export async function placeOrder(cartItems: CartItemInput[]): Promise<Order> {
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    // We assume guest checkout for now as per legacy behavior
    const order = await createOrder({
        userId: undefined, 
        items: cartItems.map(item => ({
            productId: item.id,
            variantId: item.variantId || undefined, 
            name: item.name,
            price: item.price,
            quantity: item.qty
        })),
        totalPrice,
        options: { skipReservation: false } 
    });

    return order;
}

// ==========================================
// ADMIN MANUAL ORDER ACTIONS
// ==========================================

import prisma from '@/lib/prisma';

interface ManualOrderInput {
    customer: 
        | { existingId: string }
        | { name: string; email?: string; phone: string };
    shippingAddress: {
        street: string;
        city: string;
    };
    items: { variantId: string; quantity: number }[];
    notes?: string;
    source?: string;
}

interface ManualOrderResult {
    success: boolean;
    orderId?: string;
    error?: string;
}


export async function createManualOrder(input: ManualOrderInput): Promise<ManualOrderResult> {
    try {
        await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);

        // 1. Resolve customer info
        let userId: string | undefined;
        let customerName: string;
        let customerPhone: string;
        let customerEmail: string | undefined;
        
        if ('existingId' in input.customer) {
            userId = input.customer.existingId;
            const existingUser = await prisma.user.findUnique({ 
                where: { id: userId },
                select: { name: true, phone: true, email: true }
            });
            if (!existingUser) throw new Error('Customer not found');
            customerName = existingUser.name || 'Customer';
            customerPhone = existingUser.phone || '';
            customerEmail = existingUser.email || undefined;
        } else {
            // Create new user/customer
            // Generate placeholder email if none provided (User.email is required in schema)
            const generatedEmail = input.customer.email || `manual_${Date.now()}_${Math.random().toString(36).slice(2)}@placeholder.local`;
            
            const newUser = await prisma.user.create({
                data: {
                    name: input.customer.name,
                    email: generatedEmail,
                    passwordHash: '', // Empty for manual customers
                    phone: input.customer.phone
                }
            });
            userId = newUser.id;
            customerName = input.customer.name;
            customerPhone = input.customer.phone;
            customerEmail = input.customer.email;
        }

        // 2. Get variant details and calculate total
        const variants = await prisma.variant.findMany({
            where: { id: { in: input.items.map(i => i.variantId) } },
            include: { product: { select: { name: true } } }
        });

        const orderItems = input.items.map(item => {
            const variant = variants.find(v => v.id === item.variantId);
            if (!variant) throw new Error(`Variant ${item.variantId} not found`);
            
            const price = variant.price.toNumber();
            return {
                productId: variant.productId,
                variantId: variant.id,
                name: `${variant.product.name} (${variant.sku})`,
                price,
                quantity: item.quantity
            };
        });

        const totalPrice = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // 3. Create order directly with shipping info (matching Order schema)
        // Use transaction to ensure inventory deduction is atomic with order creation
        const order = await prisma.$transaction(async (tx) => {
            // Get default warehouse
            const warehouse = await tx.warehouse.findFirst();
            if (!warehouse) {
                throw new Error('No warehouse configured');
            }

            // Verify stock availability BEFORE creating order
            for (const item of orderItems) {
                const inventory = await tx.inventory.findFirst({
                    where: {
                        warehouseId: warehouse.id,
                        variantId: item.variantId
                    }
                });

                if (!inventory || inventory.available < item.quantity) {
                    const available = inventory?.available || 0;
                    throw new Error(`Insufficient stock for product: ${item.name} (available: ${available}, required: ${item.quantity})`);
                }
            }

            // Create order
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    totalPrice,
                    status: 'pending',
                    paymentMethod: 'cod', // Manual orders are typically COD
                    customerName,
                    customerPhone,
                    customerEmail,
                    shippingAddress: input.shippingAddress.street,
                    shippingCity: input.shippingAddress.city,
                    shippingNotes: input.notes ? `[${input.source?.toUpperCase() || 'MANUAL'}] ${input.notes}` : `[${input.source?.toUpperCase() || 'MANUAL'}]`,
                    items: {
                        create: orderItems.map(item => ({
                            productId: item.productId,
                            variantId: item.variantId,
                            name: item.name,
                            sku: item.name.match(/\((.*?)\)/)?.[1] || null, // Extract SKU from name format: Name (SKU)
                            price: item.price,
                            quantity: item.quantity
                        }))
                    }
                }
            });

            // Deduct inventory (same as COD checkout)
            for (const item of orderItems) {
                const result = await tx.inventory.updateMany({
                    where: {
                        warehouseId: warehouse.id,
                        variantId: item.variantId,
                        available: { gte: item.quantity }
                    },
                    data: {
                        available: { decrement: item.quantity }
                    }
                });

                if (result.count === 0) {
                    throw new Error(`Failed to deduct inventory for product: ${item.name}`);
                }

                // Log the inventory change
                await tx.inventoryLog.create({
                    data: {
                        warehouseId: warehouse.id,
                        variantId: item.variantId,
                        action: 'ORDER_FULFILL',
                        quantity: -item.quantity,
                        reason: `Manual Order Created: ${newOrder.id}`,
                        referenceId: newOrder.id,
                    }
                });
            }

            return newOrder;
        });

        revalidatePath('/admin/orders');
        
        return { success: true, orderId: order.id };
    } catch (error) {
        console.error('Manual order creation failed:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Failed to create order' };
    }
}

