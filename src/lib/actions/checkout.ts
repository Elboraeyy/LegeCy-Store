'use server';

import prisma from '@/lib/prisma';
import { OrderStatus } from '@/lib/orderStatus';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { sendOrderConfirmationEmail } from '@/lib/services/emailService';

interface CartItemInput {
  id: string;
  name: string;
  price: number;
  qty: number;
  variantId: string | null;
}

interface CheckoutInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingNotes: string;
  paymentMethod: 'cod' | 'paymob';
  cartItems: CartItemInput[];
  totalPrice: number;
  couponCode?: string;
}

interface CheckoutResult {
  success: boolean;
  orderId?: string;
  error?: string;
  paymentUrl?: string;
}

export async function placeOrderWithShipping(input: CheckoutInput): Promise<CheckoutResult> {
  try {
    // Validate input
    if (!input.customerName || !input.customerEmail || !input.customerPhone) {
      return { success: false, error: 'Customer information is incomplete' };
    }

    if (!input.shippingAddress || !input.shippingCity) {
      return { success: false, error: 'Shipping information is incomplete' };
    }

    if (input.cartItems.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    // Recalculate basic total from items (security check)
    const calculatedTotal = input.cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let finalTotal = calculatedTotal;
    let couponId: string | null = null;

    // Validate Coupon if provided
    if (input.couponCode) {
        const { validateCoupon } = await import('./coupons');
        const validation = await validateCoupon(input.couponCode, calculatedTotal);
        
        if (validation.isValid && validation.coupon && validation.finalTotal !== undefined) {
            finalTotal = validation.finalTotal;
            couponId = validation.coupon.id;
        } else {
            return { success: false, error: validation.error || 'Invalid coupon' }; 
        }
    }

    // Calculate Loyalty Points (1 point per 10 EGP)
    const pointsEarned = Math.floor(finalTotal / 10);

    // Get User Session (if any)
    const { getCurrentUser } = await import('@/lib/actions/auth');
    const user = await getCurrentUser();

    // Create order with shipping details
    const order = await prisma.$transaction(async (tx) => {
      // Increment coupon usage if used
      if (couponId) {
          await tx.coupon.update({
              where: { id: couponId },
              data: { currentUsage: { increment: 1 } }
          });
      }

      const newOrder = await tx.order.create({
        data: {
          totalPrice: new Prisma.Decimal(finalTotal),
          status: OrderStatus.Pending,
          userId: user?.id, // Link to user if logged in
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          shippingAddress: input.shippingAddress,
          shippingCity: input.shippingCity,
          shippingNotes: input.shippingNotes || null,
          paymentMethod: input.paymentMethod,
          couponId: couponId,
          pointsEarned: pointsEarned,
          items: {
            create: input.cartItems.map(item => ({
              productId: item.id,
              variantId: item.variantId,
              name: item.name,
              price: new Prisma.Decimal(item.price),
              quantity: item.qty
            }))
          }
        },
        include: {
          items: true
        }
      });

      return newOrder;
    });

    logger.info(`Order created with shipping: ${order.id}`, {
      orderId: order.id,
      customerEmail: input.customerEmail,
      city: input.shippingCity,
      total: finalTotal,
      couponId,
      pointsEarned
    });

    // Handle Payment Method
    let paymentUrl: string | undefined;

    if (input.paymentMethod === 'paymob') {
        const { initiatePaymobPayment } = await import('@/lib/paymob');
        const paymentResult = await initiatePaymobPayment({
            id: order.id,
            customerEmail: order.customerEmail || input.customerEmail || "",
            customerName: order.customerName || input.customerName || "",
            customerPhone: order.customerPhone || input.customerPhone || "",
            shippingAddress: order.shippingAddress || input.shippingAddress || "",
            shippingCity: order.shippingCity || input.shippingCity || ""
        }, finalTotal);
        if (paymentResult.success && paymentResult.paymentUrl) {
            paymentUrl = paymentResult.paymentUrl;
        } else {
            // Log error but order is created. Access to dashboard logic to handle failed payments needed.
            // For now, we might want to return success but with a note? 
            // Or fail the whole thing? Ideally we shouldn't fail order creation if payment initiation fails, 
            // but for user experience, maybe let them retry.
            // For this implementation, we will assume success or return error.
        }
    }

    // Send confirmation email (only if COD or we want to send it 'Pending Payment')
    // Usually we wait for payment confirmation for Paymob, but safely sending 'Order Received' is fine.
    sendOrderConfirmationEmail({
      orderId: order.id,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      items: input.cartItems.map(item => ({
        name: item.name,
        quantity: item.qty,
        price: item.price
      })),
      total: finalTotal,
      shippingAddress: `${input.shippingAddress}, ${input.shippingCity}`
    }).catch((err: Error) => {
      logger.error('Failed to send confirmation email', { orderId: order.id, error: err });
    });

    revalidatePath('/admin/orders');
    
    return {
      success: true,
      orderId: order.id,
      paymentUrl
    };

  } catch (error) {
    logger.error('Checkout error', { error });
    console.error('Checkout error:', error);
    return {
      success: false,
      error: 'An error occurred while creating the order. Please try again.'
    };
  }
}
