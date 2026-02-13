'use server';

import { createOrder } from '@/lib/services/orderService';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';
import { revalidatePath } from 'next/cache';
import { OrderStatus } from '@/lib/orderStatus';
import { Order } from '@/types/order';
import prisma from '@/lib/prisma';
import { analyzeOrderRisk } from '@/lib/services/fraudService';
import { orderStateService } from '@/lib/services/orders/orderStateService';
import { validateCoupon } from '@/lib/actions/coupons';

interface StatusUpdateResult {
    success: boolean;
    error?: string;
}

export async function updateOrderStatusAction(
    orderId: string, 
    newStatus: OrderStatus,
    reason?: string
): Promise<StatusUpdateResult> {
    try {
        const admin = await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);
        
        // Use the centralized transition logic which handles inventory, finance, and loyalty
        await orderStateService.transitionOrder({
            orderId,
            newStatus,
            actor: 'admin',
            actorId: admin.id,
            reason
        });

        revalidatePath(`/admin/orders/${orderId}`);
        revalidatePath('/admin/orders');
        revalidatePath('/admin/finance');
        return { success: true };
    } catch (error) {
        console.error('[Action] Order update failed:', error);
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

interface ManualOrderInput {
    customer: 
        | { existingId: string }
        | { name: string; email?: string; phone: string };
    shippingAddress: {
        street: string;
        city: string;
        governorate?: string;
    };
    items: { variantId: string; quantity: number }[];
    notes?: string;
    source?: string;
    couponCode?: string;
    pointsRedeemed?: number;
    status?: OrderStatus;
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
        let firstName: string | undefined;
        let lastName: string | undefined;
        
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

            const nameParts = (existingUser.name || '').split(' ');
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ') || undefined;
        } else {
            const generatedEmail = input.customer.email || `manual_${Date.now()}_${Math.random().toString(36).slice(2)}@placeholder.local`;
            
            const newUser = await prisma.user.create({
                data: {
                    name: input.customer.name,
                    email: generatedEmail,
                    passwordHash: '',
                    phone: input.customer.phone
                }
            });
            userId = newUser.id;
            customerName = input.customer.name;
            customerPhone = input.customer.phone;
            customerEmail = input.customer.email;

            const nameParts = (input.customer.name || '').split(' ');
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ') || undefined;
        }

        // 2. Map items for createOrder service
        const variants = await prisma.variant.findMany({
            where: { id: { in: input.items.map(i => i.variantId) } },
            include: { product: { select: { name: true } } }
        });

        const serviceItems = input.items.map(item => {
            const variant = variants.find(v => v.id === item.variantId);
            if (!variant) throw new Error(`Variant ${item.variantId} not found`);
            return {
                productId: variant.productId,
                variantId: variant.id,
                name: `${variant.product.name} (${variant.sku})`,
                price: variant.price.toNumber(),
                quantity: item.quantity
            };
        });

        const subtotal = serviceItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        // We'll trust the client for simple calculation for now, but in production we should re-verify
        // Let's implement a more robust createOrder soon.

        const order = await createOrder({
            items: serviceItems,
            totalPrice: subtotal,
            userId,
            firstName,
            lastName,
            customerPhone: customerPhone,
            customerEmail: customerEmail,
            shippingAddress: input.shippingAddress.street,
            shippingCity: input.shippingAddress.city,
            shippingGovernorate: input.shippingAddress.governorate,
            shippingNotes: input.notes ? `[${input.source?.toUpperCase() || 'MANUAL'}] ${input.notes}` : `[${input.source?.toUpperCase() || 'MANUAL'}]`,
            paymentMethod: 'cod',
            couponCode: input.couponCode,
            pointsRedeemed: input.pointsRedeemed,
            options: {
                skipReservation: false,
                status: input.status
            }
        });

        // 3. Risk analysis
        try {
            await analyzeOrderRisk(order.id);
        } catch (e) {
            console.error('[ManualOrder] Fraud analysis failed:', e);
        }

        revalidatePath('/admin/orders');
        return { success: true, orderId: order.id };
    } catch (error) {
        console.error('Manual order creation failed:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create order' };
    }
}

/**
 * Validate coupon for manual order UI
 */
export async function validateCouponAction(code: string, cartTotal: number) {
    try {
        await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);
        const result = await validateCoupon(code, cartTotal);
        return result;
    } catch (error) {
        return { isValid: false, message: 'فشل التحقق من الكوبون' };
    }
}

/**
 * Search for customers for manual order creation
 */
export async function searchCustomersAction(query: string) {
    try {
        await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);
        if (!query || query.length < 2) return [];

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: 10,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                orders: {
                    select: { id: true, createdAt: true, totalPrice: true, status: true },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });

        return users;
    } catch (error) {
        console.error('[Action] searchCustomersAction failed:', error);
        return [];
    }
}


// --------------------------------------------------------
// GUEST ORDER LOOKUP
// --------------------------------------------------------

export async function getGuestOrder(orderId: string, emailOrPhone: string) {
    // 1. Find order
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
    });

    if (!order) return null;

    // 2. Verify Access (Simple Match)
    // Normalize phone numbers (stripping +, spaces) can be done here if needed
    const normalizedInput = emailOrPhone.trim().toLowerCase();
    const orderEmail = order.customerEmail?.toLowerCase() || '';
    const orderPhone = order.customerPhone || '';

    const isMatch = (orderEmail === normalizedInput) || (orderPhone === normalizedInput);

    if (!isMatch) return null;

    return order;
}
