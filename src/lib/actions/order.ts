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
