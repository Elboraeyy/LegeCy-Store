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
  shippingCost?: number; // Shipping cost calculated at checkout
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
    // RATE LIMITING CHECK
    // ========================================
    const { checkCheckoutRateLimit, getClientIdentifier } = await import('@/lib/security/rateLimit');
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const clientId = getClientIdentifier(headersList);

    const rateLimit = await checkCheckoutRateLimit(clientId);
    if (!rateLimit.success) {
      logger.warn('Checkout rate limit exceeded', { clientId, remaining: rateLimit.remaining });
      return {
        success: false,
        error: 'Too many checkout attempts. Please wait a moment and try again.'
      };
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
      
      // Price verified - continue to next item
    }
    
    // Get User Session (if any) - needed for coupon per-user check
    const { getCurrentUser } = await import('@/lib/actions/auth');
    const user = await getCurrentUser();
    
    // ========================================
    // AUTOMATIC PROMOTION DISCOUNTS
    // ========================================
    // Apply discounts from Product Offers, BOGO, etc. (before coupon)
    const { calculateCartDiscounts, enrichCartItemsWithCategories } = await import('@/lib/services/discountService');
    
    // Prepare cart items with category info for discount calculation
    const itemsForDiscount = await enrichCartItemsWithCategories(
        input.cartItems.map(item => ({
            productId: item.id,
            variantId: item.variantId || undefined,
            price: item.price,
            quantity: item.qty
        }))
    );
    
    const discountResult = await calculateCartDiscounts(itemsForDiscount);
    
    let finalTotal = discountResult.finalTotal;
    let couponId: string | null = null;
    
    // Applied automatic discounts are stored in discountResult.appliedDiscounts
    // TODO: Save these to order record for receipt display

    // Validate Coupon if provided (with per-user check)
    // Coupon is applied ON TOP of automatic discounts
    let totalDiscountFromCoupon = 0; // Track coupon discount for proportional distribution
    const subtotalBeforeCoupon = finalTotal; // Subtotal after automatic discounts, before coupon

    if (input.couponCode) {
        const { validateCoupon } = await import('./coupons');
        const validation = await validateCoupon(
            input.couponCode, 
            finalTotal, // Apply coupon to already-discounted total
            input.customerEmail,  // For per-user limit
            user?.id              // For per-user limit
        );
        
        if (validation.isValid && validation.coupon && validation.finalTotal !== undefined) {
          totalDiscountFromCoupon = finalTotal - validation.finalTotal; // Calculate the discount amount
            finalTotal = validation.finalTotal;
            couponId = validation.coupon.id;
        } else {
            return { success: false, error: validation.error || 'Invalid coupon' }; 
        }
    }

    // Calculate Loyalty Points (1 point per 10 EGP)
    const pointsEarned = Math.floor(finalTotal / 10);

    // ========================================
    // FRAUD DETECTION (COD Only)
    // ========================================
    if (input.paymentMethod === 'cod') {
      const { analyzeRisk } = await import('@/lib/services/fraudService');
      const fraudAnalysis = await analyzeRisk({
        totalAmount: finalTotal,
        items: input.cartItems.map(i => ({ name: i.name, quantity: i.qty })),
        customerEmail: input.customerEmail,
        userId: user?.id,
        shippingCity: input.shippingCity,
        ipAddress: (await headers()).get('x-forwarded-for') || 'unknown'
      });

      if (fraudAnalysis.shouldBlock) {
        logger.warn('COD Order blocked by fraud detection', {
          email: input.customerEmail,
          score: fraudAnalysis.riskScore,
          reasons: fraudAnalysis.factors
        });
        return {
          success: false,
          error: 'Your order cannot be processed with Cash on Delivery at this time. Please try a valid online payment method.'
        };
      }
    }

    // Create order with shipping details
    const order = await prisma.$transaction(async (tx) => {
      // Increment coupon usage with atomic checks
      if (couponId) {
        // 1. Re-fetch coupon inside transaction to lock/read latest state
        const coupon = await tx.coupon.findUnique({ where: { id: couponId } });

        if (!coupon) throw new Error('Invalid coupon code'); // Should have been caught earlier but safe check

        // 2. Atomic Global Usage Check & Increment
        if (coupon.usageLimit !== null) {
          const result = await tx.coupon.updateMany({
            where: {
              id: couponId,
              currentUsage: { lt: coupon.usageLimit }
            },
            data: { currentUsage: { increment: 1 } }
          });
          if (result.count === 0) {
            throw new Error('Coupon usage limit reached');
          }
        } else {
        // No limit, just increment
          await tx.coupon.update({
            where: { id: couponId },
            data: { currentUsage: { increment: 1 } }
          });
        }
      }

      // Get default warehouse for inventory operations
      // FIX: Use robust selection logic (Audit Requirement 1.1)
      const warehouse = await getDefaultWarehouse(tx);
      if (!warehouse) {
        throw new Error('No active warehouse configured for fulfillment');
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

      // Calculate subtotal (before discounts)
      const subtotalAmount = input.cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

      // Calculate total discount amount
      const totalDiscountAmount = subtotalAmount - finalTotal;

      // Calculate Shipping Cost
      let shippingCost = new Prisma.Decimal(50); // Default fallback
      if (input.shippingCity) {
        const zone = await tx.shippingZone.findFirst({
          where: { cities: { has: input.shippingCity } }
        });
        if (zone) {
          shippingCost = zone.baseRate;
        }
      }

      // Fetch cost prices for all items (for COGS tracking)
      const variantCostMap: Record<string, number> = {};
      for (const item of input.cartItems) {
        if (item.variantId) {
          const variant = await tx.variant.findUnique({
            where: { id: item.variantId },
            select: { costPrice: true }
          });
          if (variant?.costPrice) {
            variantCostMap[item.variantId] = Number(variant.costPrice);
          }
        }
      }

      const newOrder = await tx.order.create({
        data: {
          // CRITICAL: Store all financial components for accurate reporting
          subtotal: new Prisma.Decimal(subtotalAmount),
          discountAmount: new Prisma.Decimal(totalDiscountAmount > 0 ? totalDiscountAmount : 0),
          shippingCost: shippingCost,
          totalPrice: new Prisma.Decimal(finalTotal).add(shippingCost), // Add shipping to total
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
            create: input.cartItems.map(item => {
              // Calculate proportional discount per item
              // Each item's discount share = (item price × qty / subtotal) × total discount
              const itemTotal = item.price * item.qty;
              let discountedPricePerUnit: number | null = null;

              if (totalDiscountFromCoupon > 0 && subtotalBeforeCoupon > 0) {
                const itemDiscountShare = totalDiscountFromCoupon * (itemTotal / subtotalBeforeCoupon);
                discountedPricePerUnit = item.price - (itemDiscountShare / item.qty);
                // Ensure discounted price is not negative
                discountedPricePerUnit = Math.max(0, discountedPricePerUnit);
              }

              // Get cost price for COGS tracking (CRITICAL for refund reversals)
              const costAtPurchase = item.variantId ? variantCostMap[item.variantId] : null;

              return {
                productId: item.id,
                variantId: item.variantId,
                name: item.name,
                sku: item.variantId ? variantSkuMap[item.variantId] : null, // SKU snapshot
                price: new Prisma.Decimal(item.price),
                discountedPrice: discountedPricePerUnit !== null
                  ? new Prisma.Decimal(discountedPricePerUnit)
                  : null,
                costAtPurchase: costAtPurchase !== null
                  ? new Prisma.Decimal(costAtPurchase)
                  : null, // COGS snapshot for accurate reversal
                quantity: item.qty,
                warehouseId: warehouse.id // Audit Fix: Track fulfillment source
              };
            })
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
      // CRITICAL FIX: Calculate shipping from order total minus items subtotal
      // This ensures email amount matches what was actually charged
      const itemsSubtotal = input.cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const calculatedShipping = Number(order.totalPrice) - finalTotal;
      sendOrderConfirmationEmail({
      orderId: order.id,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      items: input.cartItems.map(item => ({
        name: item.name,
        quantity: item.qty,
        price: item.price
      })),
        subtotal: itemsSubtotal,
        shipping: calculatedShipping > 0 ? calculatedShipping : 0,
        total: Number(order.totalPrice),
      shippingAddress: `${input.shippingAddress}, ${input.shippingCity}`,
      paymentMethod: 'cod'
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

    // Extract specific error message for better user feedback
    let errorMessage = 'An error occurred while creating the order. Please try again.';

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();

      // Pass through specific, user-friendly error messages
      if (msg.includes('insufficient stock') || msg.includes('available:')) {
        errorMessage = error.message;
      } else if (msg.includes('unavailable') || msg.includes('not found')) {
        errorMessage = error.message;
      } else if (msg.includes('coupon') || msg.includes('usage limit')) {
        errorMessage = error.message;
      } else if (msg.includes('price') && msg.includes('changed')) {
        errorMessage = error.message;
      } else if (msg.includes('warehouse')) {
        errorMessage = 'Unable to process order at this time. Please contact support.';
      } else if (msg.includes('payment')) {
        errorMessage = 'Payment processing error. Please try again or use a different payment method.';
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Helper to get the correct warehouse for fulfillment.
 * Improved Logic:
 * 1. Priority: Active 'MAIN' warehouse.
 * 2. Fallback: First created Active warehouse (stable fallback).
 */
async function getDefaultWarehouse(tx: Prisma.TransactionClient) {
  // Priority 1: Main Warehouse
  let warehouse = await tx.warehouse.findFirst({
    where: { type: 'MAIN', isActive: true }
  });

  // Priority 2: Fallback to any active warehouse (oldest first for stability)
  if (!warehouse) {
    warehouse = await tx.warehouse.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });
  }

  return warehouse;
}
