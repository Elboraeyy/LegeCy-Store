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
import { sendOrderConfirmationEmail } from '@/lib/services/emailService';
import { resolveDefaultVariantsMap } from '@/lib/products/resolve-default-variant';

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
        return { success: true };
    } catch (error) {
        console.error('[Action] Order update failed:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Unknown system error occurred.' };
    }
}

export async function updateOrderAction(orderId: string, data: unknown) {
    try {
        // 1. Try Admin Permission
        const adminUser = await requireAdminPermission(AdminPermissions.ORDERS.MANAGE).catch(() => null);

        if (!adminUser) {
            // 2. If not admin, authenticate as Customer
            const { validateCustomerSession } = await import('@/lib/auth/session');
            const { user: customerUser } = await validateCustomerSession();

            if (!customerUser) {
                throw new Error("Unauthorized");
            }

            // 3. Verify Ownership & Status
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                select: { userId: true, status: true }
            });

            if (!order) throw new Error("Order not found");

            if (order.userId !== customerUser.id) {
                throw new Error("Unauthorized access to order");
            }

            const allowEdit = [OrderStatus.Pending, OrderStatus.Draft, OrderStatus.PaymentPending].includes(order.status as OrderStatus);
            if (!allowEdit) {
                throw new Error("Order cannot be edited in current status");
            }
        }

        // Validate Data
        const { updateOrderDetailsSchema } = await import('@/lib/validators/order');
        const validated = updateOrderDetailsSchema.parse(data);

        await import('@/lib/services/orderService').then(m => m.updateOrder(orderId, validated));

        revalidatePath(`/admin/orders/${orderId}`);
        revalidatePath(`/orders/${orderId}`);
        return { success: true };
    } catch (error) {
        console.error("Update failed", error);
        return { success: false, error: error instanceof Error ? error.message : "Update failed" };
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
    customer?: 
        | { existingId: string }
    | { name: string; email?: string; phone: string; alternativePhone?: string };
    shippingAddress?: {
        street: string;
        city: string;
        governorate?: string;
    };
    items?: { productId?: string; variantId: string | null; quantity: number }[];
    notes?: string;
    source?: string;
    couponCode?: string;
    pointsRedeemed?: number;
    status?: OrderStatus;
    discountAmount?: number;
    paymentMethod?: string;
    shippingCost?: number;
    adminId?: string; // For tracking updates
    skipAuthCheck?: boolean; // Used by mobile API
}

interface ManualOrderResult {
    success: boolean;
    orderId?: string;
    error?: string;
}


export async function createManualOrder(input: ManualOrderInput): Promise<ManualOrderResult> {
    try {
        if (!input.skipAuthCheck) {
            await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);
        }

        if (!input.customer || !input.shippingAddress || !input.items) {
            throw new Error('Customer, shipping address, and items are required for order creation');
        }

        const customer = input.customer;
        const shippingAddress = input.shippingAddress;
        const items = input.items;

        // 1. Resolve customer info
        let userId: string | undefined;
        let customerPhone: string;
        let customerEmail: string | undefined;
        let alternativePhone: string | undefined;
        let firstName: string | undefined;
        let lastName: string | undefined;
        
        if ('existingId' in customer) {
            userId = customer.existingId;
            const existingUser = await prisma.user.findUnique({ 
                where: { id: userId },
                select: { name: true, phone: true, email: true }
            });
            if (!existingUser) throw new Error('Customer not found');
            customerPhone = existingUser.phone || '';
            customerEmail = existingUser.email || undefined;
            // For existing users, we don't currently have a way to pull alternativePhone unless we add it to User model
            // For now, it stays undefined for existing users in this context

            const nameParts = (existingUser.name || '').split(' ');
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ') || undefined;
        } else {
            const generatedEmail = customer.email || `manual_${Date.now()}_${Math.random().toString(36).slice(2)}@placeholder.local`;
            
            const newUser = await prisma.user.create({
                data: {
                    name: customer.name,
                    email: generatedEmail,
                    passwordHash: '',
                    phone: customer.phone,
                    addresses: {
                        create: {
                            name: customer.name,
                            phone: customer.phone,
                            street: shippingAddress.street,
                            city: shippingAddress.city,
                            governorate: shippingAddress.governorate,
                            isDefault: true,
                        }
                    }
                }
            });
            userId = newUser.id;
            customerPhone = customer.phone;
            customerEmail = customer.email;
            alternativePhone = customer.alternativePhone;

            const nameParts = (customer.name || '').split(' ');
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ') || undefined;
        }

        // 2. Map items for createOrder service
        const defaultVariants = await resolveDefaultVariantsMap(
            prisma,
            items.map((item) => item.productId ?? '').filter(Boolean),
        );
        const variantIds = items
            .map(i => i.variantId)
            .filter((id): id is string => !!id);

        const variants = await prisma.variant.findMany({
            where: {
                OR: [
                    ...(variantIds.length > 0 ? [{ id: { in: variantIds } }] : []),
                    { productId: { in: Array.from(defaultVariants.keys()) } },
                ],
            },
            include: { product: { select: { name: true } } }
        });

        const serviceItems = items.map(item => {
            const explicitProductId = item.productId;
            const fallbackVariantId = explicitProductId
                ? defaultVariants.get(explicitProductId)?.id
                : undefined;
            const variant = variants.find(v => v.id === (item.variantId || fallbackVariantId));
            if (!variant) throw new Error(`No stock record found for product`);
            return {
                productId: variant.productId,
                variantId: variant.id,
                name: `${variant.product.name} (${variant.sku})`,
                price: variant.price.toNumber(),
                quantity: item.quantity
            };
        });

        const subtotal = serviceItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

        // Calculate Final Total
        // Total = Subtotal + Shipping - Discount - PointsRedeemed(value)
        // For manual orders, discountAmount and shippingCost are explicitly provided.
        const shipping = input.shippingCost || 0;
        const discount = input.discountAmount || 0;
        const finalTotal = Math.max(0, subtotal + shipping - discount);

        const order = await createOrder({
            items: serviceItems,
            totalPrice: finalTotal,
            subtotal: subtotal,
            userId,
            firstName,
            lastName,
            customerPhone: customerPhone,
            customerEmail: customerEmail,
            alternativePhone: alternativePhone,
            shippingAddress: shippingAddress.street,
            shippingCity: shippingAddress.city,
            shippingGovernorate: shippingAddress.governorate,
            shippingNotes: input.notes ? `[${input.source?.toUpperCase() || 'MANUAL'}] ${input.notes}` : `[${input.source?.toUpperCase() || 'MANUAL'}]`,
            paymentMethod: (input.paymentMethod as "cod" | "wallet" | "instapay" | "card") || 'cod',
            couponCode: input.couponCode,
            pointsRedeemed: input.pointsRedeemed,
            discountAmount: discount,
            shippingCost: shipping,
            orderSource: input.source || 'manual',
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

        // 4. Send Order Confirmation Email
        if (customerEmail) {
            // Run in background to avoid blocking response
            (async () => {
                try {
                    await sendOrderConfirmationEmail({
                        orderId: order.id,
                        orderNumber: order.orderNumber || 0,
                        customerName: [firstName, lastName].filter(Boolean).join(' ') || 'Customer',
                        customerEmail: customerEmail!,
                        items: serviceItems.map(i => ({
                            name: i.name,
                            quantity: i.quantity,
                            price: i.price
                        })),
                        subtotal: subtotal,
                        shipping: shipping,
                        total: finalTotal,
                        shippingAddress: `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.governorate || ''}`,
                        paymentMethod: input.paymentMethod || 'cod'
                    });
                } catch (emailError) {
                    console.error('[ManualOrder] Start email failed:', emailError);
                }
            })();
        }

        revalidatePath('/admin/orders');
        return { success: true, orderId: order.id };
    } catch (error) {
        console.error('Manual order creation failed:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create order' };
    }
}

export async function adminUpdateOrder(orderId: string, input: ManualOrderInput): Promise<ManualOrderResult> {
    try {
        console.log(`[AdminUpdateOrder] Starting update for order ${orderId}`, {
            hasCustomer: !!input.customer,
            hasItems: !!input.items,
            hasAddress: !!input.shippingAddress
        });

        if (!input.skipAuthCheck) {
            await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);
        }

        // 1. Resolve customer info
        let userId: string | undefined;
        let customerPhone: string | undefined;
        let customerEmail: string | undefined;
        let alternativePhone: string | undefined;
        let firstName: string | undefined;
        let lastName: string | undefined;
        
        if (input.customer && 'existingId' in input.customer) {
            userId = input.customer.existingId;
            if (userId) {
                const existingUser = await prisma.user.findUnique({ 
                    where: { id: userId },
                    select: { name: true, phone: true, email: true }
                });
                
                if (existingUser) {
                    customerPhone = existingUser.phone || '';
                    customerEmail = existingUser.email || undefined;
                    const nameParts = (existingUser.name || '').split(' ');
                    firstName = nameParts[0];
                    lastName = nameParts.slice(1).join(' ') || undefined;
                }
            }
        } 
        
        // IMPORTANT: If the mobile app provides name/phone explicitly, 
        // they should OVERRIDE the user profile data for this specific order.
        // This handles cases where an admin edits a guest order or changes 
        // the contact info for an existing user's order.
        const manualCust = input.customer as { name?: string; phone?: string; email?: string; alternativePhone?: string } | null;
        if (manualCust) {
            if (manualCust.phone) customerPhone = manualCust.phone;
            if (manualCust.email) customerEmail = manualCust.email;
            if (manualCust.alternativePhone) alternativePhone = manualCust.alternativePhone;
            if (manualCust.name) {
                const nameParts = manualCust.name.split(' ');
                firstName = nameParts[0];
                lastName = nameParts.slice(1).join(' ') || undefined;
            }
        }

        // 2. Resolve items
        let serviceItems: {
            productId: string;
            variantId: string | null;
            name: string;
            price: number;
            quantity: number;
        }[] | undefined;
        if (input.items) {
            console.log(`[AdminUpdateOrder] Processing ${input.items.length} items`);
            
            const currentOrder = await prisma.order.findUnique({
                where: { id: orderId },
                include: { items: true }
            });
            if (!currentOrder) throw new Error('Order not found');

            const nonNullVariantIds = input.items
                .map(i => i.variantId)
                .filter((id): id is string => !!id);
            const explicitProductIds = input.items
                .map((i) => (i as unknown as { productId?: string }).productId)
                .filter((id): id is string => !!id);
            const defaultVariants = await resolveDefaultVariantsMap(prisma, explicitProductIds);

            const variants = await prisma.variant.findMany({
                where: {
                    OR: [
                        ...(nonNullVariantIds.length > 0 ? [{ id: { in: nonNullVariantIds } }] : []),
                        ...(explicitProductIds.length > 0 ? [{ productId: { in: explicitProductIds } }] : []),
                    ],
                },
                include: { product: { select: { name: true } } }
            });

            const existingNullItems = currentOrder.items.filter(i => !i.variantId);
            let nullItemIndex = 0;

            serviceItems = input.items.map(item => {
                if (item.variantId) {
                    const variant = variants.find(v => v.id === item.variantId);
                    if (!variant) throw new Error(`Variant ${item.variantId} not found`);
                    return {
                        productId: variant.productId,
                        variantId: variant.id,
                        name: `${variant.product.name} (${variant.sku})`,
                        price: variant.price.toNumber(),
                        quantity: item.quantity
                    };
                } else {
                    const explicitProductId = (item as unknown as { productId?: string }).productId;
                    if (explicitProductId) {
                        const variant = variants.find(
                            (v) => v.id === defaultVariants.get(explicitProductId)?.id,
                        );
                        if (variant) {
                            return {
                                productId: variant.productId,
                                variantId: variant.id,
                                name: `${variant.product.name} (${variant.sku})`,
                                price: variant.price.toNumber(),
                                quantity: item.quantity
                            };
                        }
                    }
                    const existingItem = existingNullItems[nullItemIndex++];
                    if (!existingItem) {
                        throw new Error('New items added to the order must have a valid variantId');
                    }
                    return {
                        productId: existingItem.productId,
                        variantId: null,
                        name: existingItem.name,
                        price: existingItem.price.toNumber(),
                        quantity: item.quantity
                    };
                }
            });
        }

        // 3. Call updateOrder service
        const { updateOrder, updateOrderStatus } = await import('@/lib/services/orderService');
        console.log('[AdminUpdateOrder] Calling updateOrder service...');
        
        const updated = await updateOrder(orderId, {
            firstName,
            lastName,
            customerPhone,
            customerEmail,
            alternativePhone,
            shippingAddress: input.shippingAddress?.street,
            shippingCity: input.shippingAddress?.city,
            shippingGovernorate: input.shippingAddress?.governorate,
            items: serviceItems?.length ? serviceItems : undefined,
            shippingCost: input.shippingCost,
            discountAmount: input.discountAmount,
            shippingNotes: input.notes,
            orderSource: input.source,
        });

        console.log('[AdminUpdateOrder] Service call successful', {
            newTotal: updated.totalPrice.toString()
        });

        // Update userId if it changed
        if (userId) {
            await prisma.order.update({
                where: { id: orderId },
                data: { userId }
            });
        }

        // Handle status update if provided and different
        if (input.status) {
            const currentOrder = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
            if (currentOrder && currentOrder.status !== input.status) {
                let adminId = input.adminId;
                if (!adminId && !input.skipAuthCheck) {
                    const admin = await requireAdminPermission(AdminPermissions.ORDERS.MANAGE).catch(() => null);
                    adminId = admin?.id;
                }
                console.log(`[AdminUpdateOrder] Updating status to ${input.status}`);
                await updateOrderStatus(orderId, input.status, 'admin', adminId, 'Updated during admin order edit');
            }
        }

        try {
            revalidatePath(`/admin/orders/${orderId}`);
            revalidatePath('/admin/orders');
        } catch (e) {
            console.warn('[AdminUpdateOrder] Failed to revalidate paths (expected if not running in Next.js request context):', e);
        }
        console.log('[AdminUpdateOrder] Update completed successfully');
        return { success: true, orderId };
    } catch (error) {
        console.error('Manual order update failed:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update order' };
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
    } catch {
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
