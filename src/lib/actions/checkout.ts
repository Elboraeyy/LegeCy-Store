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
  paymentMethod: 'cod' | 'paymob' | 'wallet';
  cartItems: CartItemInput[];
  totalPrice: number;
  couponCode?: string;
  walletNumber?: string;
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

      // Get default warehouse for inventory operations
      const warehouse = await tx.warehouse.findFirst();
      if (!warehouse) {
          throw new Error('No warehouse configured');
      }

      // STEP 1: Verify all products are active and have sufficient stock BEFORE creating order
      // Also collect SKUs for order item snapshot
      const insufficientStockItems: string[] = [];
      const unavailableProducts: string[] = [];
      const variantSkuMap: Record<string, string> = {}; // Map variantId -> sku

      for (const item of input.cartItems) {
        // Check product status
        const product = await tx.product.findUnique({
          where: { id: item.id },
          select: { status: true, name: true }
        });

        if (!product || product.status !== 'active') {
          unavailableProducts.push(item.name);
          continue;
        }

        // Check stock for items with variants and fetch SKU
        if (item.variantId) {
          const variant = await tx.variant.findUnique({
            where: { id: item.variantId },
            select: { sku: true }
          });

          if (variant) {
            variantSkuMap[item.variantId] = variant.sku;
          }

          const inventory = await tx.inventory.findFirst({
            where: {
              warehouseId: warehouse.id,
              variantId: item.variantId
            }
          });

          if (!inventory || inventory.available < item.qty) {
            const available = inventory?.available || 0;
            insufficientStockItems.push(`${item.name} (available: ${available}, required: ${item.qty})`);
          }
        }
      }

      // Fail early if any products are unavailable
      if (unavailableProducts.length > 0) {
        throw new Error(`The following products are unavailable: ${unavailableProducts.join(', ')}`);
      }

      // Fail early if insufficient stock
      if (insufficientStockItems.length > 0) {
        throw new Error(`Insufficient stock for the following products: ${insufficientStockItems.join(', ')}`);
      }

      // STEP 2: Create the order
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
              sku: item.variantId ? variantSkuMap[item.variantId] : null, // SKU snapshot
              price: new Prisma.Decimal(item.price),
              quantity: item.qty
            }))
          }
        },
        include: {
          items: true
        }
      });

      // STEP 3: Deduct inventory with verification
      for (const item of input.cartItems) {
        if (!item.variantId) continue;

        if (input.paymentMethod === 'cod') {
          // COD: Deduct immediately from available (no reservation)
          const result = await tx.inventory.updateMany({
            where: {
              warehouseId: warehouse.id,
              variantId: item.variantId,
              available: { gte: item.qty }
            },
            data: {
              available: { decrement: item.qty }
            }
          });

          // CRITICAL: Verify the update succeeded
          if (result.count === 0) {
            throw new Error(`Failed to deduct inventory for product: ${item.name}. Insufficient stock.`);
          }

          // Log the inventory change
          await tx.inventoryLog.create({
            data: {
              warehouseId: warehouse.id,
              variantId: item.variantId,
              action: 'ORDER_FULFILL',
              quantity: -item.qty,
              reason: `COD Order Created: ${newOrder.id}`,
              referenceId: newOrder.id,
            }
          });
        } else {
          // Online payment: Reserve stock until payment confirmed
          const result = await tx.inventory.updateMany({
            where: {
              warehouseId: warehouse.id,
              variantId: item.variantId,
              available: { gte: item.qty }
            },
            data: {
              available: { decrement: item.qty },
              reserved: { increment: item.qty }
            }
          });

          // CRITICAL: Verify the update succeeded
          if (result.count === 0) {
            throw new Error(`Failed to reserve inventory for product: ${item.name}. Insufficient stock.`);
          }
        }
      }

      return newOrder;
    }, {
      maxWait: 5000, // default: 2000
      timeout: 20000 // default: 5000
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

    if (input.paymentMethod === 'paymob' || input.paymentMethod === 'wallet') {
        const { initiatePaymobPayment } = await import('@/lib/paymob');
        console.log(`💳 Initiating Paymob (${input.paymentMethod}) for Order:`, order.id);
        
        try {
            const paymentResult = await initiatePaymobPayment({
                id: order.id,
                customerEmail: order.customerEmail || input.customerEmail || "customer@example.com",
                customerName: order.customerName || input.customerName || "Visitor",
                customerPhone: order.customerPhone || input.customerPhone || "01000000000",
                shippingAddress: order.shippingAddress || input.shippingAddress || "Cairo",
                shippingCity: order.shippingCity || input.shippingCity || "Cairo"
            }, finalTotal, input.paymentMethod === 'paymob' ? 'card' : 'wallet', input.walletNumber);

            if (paymentResult.success && paymentResult.paymentUrl) {
                paymentUrl = paymentResult.paymentUrl;
            } else {
                logger.error('Paymob initiation failed', { orderId: order.id, error: paymentResult.error });
                return {
                    success: false,
                    error: `Payment initiation failed: ${paymentResult.error || 'Unknown error'}`
                };
            }
        } catch (e) {
             logger.error('Paymob initiation exception', { orderId: order.id, error: e });
             return {
                 success: false,
                 error: 'System error during payment initiation.'
             };
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
