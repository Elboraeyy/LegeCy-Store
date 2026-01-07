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
  idempotencyKey?: string; // Prevents duplicate orders on refresh/retry
}

interface CheckoutResult {
  success: boolean;
  orderId?: string;
  error?: string;
  paymentUrl?: string;
}

export async function placeOrderWithShipping(input: CheckoutInput): Promise<CheckoutResult> {
  try {
    // ========================================
    // KILL SWITCH CHECKS
    // ========================================
    const { getKillSwitches, isPaymentMethodEnabled } = await import('@/lib/killSwitches');
    const switches = await getKillSwitches();
    
    if (!switches.checkout_enabled) {
      return { success: false, error: 'Checkout is temporarily disabled. Please try again later.' };
    }
    
    if (!await isPaymentMethodEnabled(input.paymentMethod)) {
      return { success: false, error: `${input.paymentMethod === 'cod' ? 'Cash on delivery' : 'Online payment'} is currently unavailable.` };
    }
    
    if (input.couponCode && !switches.coupons_enabled) {
      return { success: false, error: 'Coupon codes are temporarily disabled.' };
    }

    // ========================================
    // INPUT VALIDATION
    // ========================================
    if (!input.customerName || !input.customerEmail || !input.customerPhone) {
      return { success: false, error: 'Customer information is incomplete' };
    }

    if (!input.shippingAddress || !input.shippingCity) {
      return { success: false, error: 'Shipping information is incomplete' };
    }

    if (input.cartItems.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    // ========================================
    // IDEMPOTENCY CHECK
    // ========================================
    if (input.idempotencyKey) {
      const existingOrder = await prisma.order.findUnique({
        where: { idempotencyKey: input.idempotencyKey }
      });
      
      if (existingOrder) {
        logger.info(`Idempotent order detected, returning existing order`, { orderId: existingOrder.id });
        return { success: true, orderId: existingOrder.id };
      }
    }

    // ========================================
    // PRICE VERIFICATION FROM DATABASE
    // ========================================
    let calculatedTotal = 0;
    
    for (const item of input.cartItems) {
      // Fetch actual price from database
      const product = await prisma.product.findUnique({
        where: { id: item.id },
        include: { variants: { 
            where: item.variantId ? { id: item.variantId } : undefined 
          } 
        }
      });
      
      if (!product) {
        return { success: false, error: `Product "${item.name}" not found` };
      }
      
      if (product.status !== 'active') {
        return { success: false, error: `Product "${item.name}" is no longer available` };
      }
      
      // Get the correct price (variant price or product price)
      if (product.variants.length === 0) { return { success: false, error: `Product "${item.name}" has no variant configured` }; } const dbPrice = Number(product.variants[0].price);
      
      // Verify client price matches DB price (within 1 cent tolerance for rounding)
      if (Math.abs(dbPrice - item.price) > 0.01) {
        logger.warn(`Price mismatch detected`, { 
          productId: item.id, 
          clientPrice: item.price, 
          dbPrice,
          difference: Math.abs(dbPrice - item.price)
        });
        return { success: false, error: `Price has changed for "${item.name}". Please refresh and try again.` };
      }
      
      calculatedTotal += dbPrice * item.qty;
    }
    
    // Get User Session (if any) - needed for coupon per-user check
    const { getCurrentUser } = await import('@/lib/actions/auth');
    const user = await getCurrentUser();
    
    let finalTotal = calculatedTotal;
    let couponId: string | null = null;

    // Validate Coupon if provided (with per-user check)
    if (input.couponCode) {
        const { validateCoupon } = await import('./coupons');
        const validation = await validateCoupon(
            input.couponCode, 
            calculatedTotal,
            input.customerEmail,  // For per-user limit
            user?.id              // For per-user limit
        );
        
        if (validation.isValid && validation.coupon && validation.finalTotal !== undefined) {
            finalTotal = validation.finalTotal;
            couponId = validation.coupon.id;
        } else {
            return { success: false, error: validation.error || 'Invalid coupon' }; 
        }
    }

    // Calculate Loyalty Points (1 point per 10 EGP)
    const pointsEarned = Math.floor(finalTotal / 10);

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
      // Use PaymentPending for online payments, Pending for COD
      const initialStatus = (input.paymentMethod === 'paymob' || input.paymentMethod === 'wallet')
        ? OrderStatus.PaymentPending
        : OrderStatus.Pending;

      // Get customer IP for fraud detection
      const { headers } = await import('next/headers');
      const headersList = await headers();
      const customerIP = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() 
        || headersList.get('x-real-ip') 
        || 'unknown';

      const newOrder = await tx.order.create({
        data: {
          totalPrice: new Prisma.Decimal(finalTotal),
          status: initialStatus,
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
          idempotencyKey: input.idempotencyKey || null, // Prevent duplicate orders
          customerIP: customerIP, // Fraud detection
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

      // Record coupon usage for per-user tracking
      if (couponId) {
        await tx.couponUsage.create({
          data: {
            couponId,
            userId: user?.id || null,
            userEmail: input.customerEmail,
            orderId: newOrder.id
          }
        });
      }

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
                    error: paymentResult.error || 'Payment initiation failed'
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

    // Send confirmation email ONLY for COD orders
    // For online payments, email will be sent after payment confirmation (in paymentService.ts)
    if (input.paymentMethod === 'cod') {
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
    }

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
