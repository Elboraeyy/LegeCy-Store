'use server';

import prisma from '@/lib/prisma';
import { OrderStatus } from '@/lib/orderStatus';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { FraudCheckResult } from '@/lib/services/fraudService';
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
  firstName: string;
  lastName: string;
  customerEmail: string;
  customerPhone: string;
  customerAltPhone?: string;
  shippingAddress: string;
  shippingGovernorate: string;
  shippingCity: string;
  shippingNotes: string;
  paymentMethod: 'cod' | 'wallet' | 'instapay';
  cartItems: CartItemInput[];
  totalPrice: number;
  shippingCost?: number; // Shipping cost calculated at checkout
  couponCode?: string;
  walletNumber?: string;
  walletReference?: string; // New Field
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
    const { headers: getHeaders } = await import('next/headers');
    const headersListForRateLimit = await getHeaders();
    const clientId = getClientIdentifier(headersListForRateLimit);

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
    if (!input.firstName || !input.lastName || !input.customerEmail || !input.customerPhone) {
      return { success: false, error: 'Customer information is incomplete' };
    }

    if (!input.shippingAddress || !input.shippingGovernorate || !input.shippingCity) {
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
    // PRICE VERIFICATION FROM DATABASE (OPTIMIZED: BATCH QUERY)
    // ========================================

    // OPTIMIZATION: Fetch all products and variants in parallel batch queries instead of loop
    const productIds = input.cartItems.map(i => i.id);
    const variantIds = input.cartItems.filter(i => i.variantId).map(i => i.variantId) as string[];
    
    const [productsForPriceCheck, variantsForPriceCheck, allProductVariants] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, status: true, name: true }
      }),
      variantIds.length > 0 ? prisma.variant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, productId: true, price: true }
      }) : Promise.resolve([]),
      // Fetch all variants for products (we'll pick first one per product in JS)
      prisma.variant.findMany({
        where: { productId: { in: productIds } },
        select: { id: true, productId: true, price: true },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    const productMap = new Map(productsForPriceCheck.map(p => [p.id, p]));
    const variantMap = new Map(variantsForPriceCheck.map(v => [v.id, v]));
    // Map productId -> first variant price (for items without variantId)
    // Group by productId and take first variant for each
    const productFirstVariantMap = new Map<string, number>();
    for (const variant of allProductVariants) {
      if (!productFirstVariantMap.has(variant.productId)) {
        productFirstVariantMap.set(variant.productId, Number(variant.price));
      }
    }

    // Verify prices and product status
    for (const item of input.cartItems) {
      const product = productMap.get(item.id);
      
      if (!product) {
        return { success: false, error: `Product "${item.name}" not found` };
      }
      
      if (product.status !== 'active') {
        return { success: false, error: `Product "${item.name}" is no longer available` };
      }
      
      // Get price from variant if exists, otherwise use first variant of product
      let dbPrice: number;
      if (item.variantId) {
        const variant = variantMap.get(item.variantId);
        if (!variant || variant.productId !== item.id) {
          return { success: false, error: `Variant not found for "${item.name}"` };
        }
        dbPrice = Number(variant.price);
      } else {
        const firstVariantPrice = productFirstVariantMap.get(item.id);
        if (firstVariantPrice === undefined) {
          return { success: false, error: `Product "${item.name}" has no variant configured` };
        }
        dbPrice = firstVariantPrice;
      }
      
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
    }

    // ========================================
    // PARALLEL OPERATIONS: User, Discounts, Loyalty
    // ========================================
    // OPTIMIZATION: Run ALL independent operations in parallel
    const { getCurrentUser } = await import('@/lib/actions/auth');
    const { calculateCartDiscounts, enrichCartItemsWithCategories } = await import('@/lib/services/discountService');
    const { getLoyaltySettings } = await import('@/lib/services/loyaltyService');
    
    // Prepare cart items for discount calculation (synchronous operation)
    const cartItemsForDiscount = input.cartItems.map(item => ({
      productId: item.id,
      variantId: item.variantId || undefined,
      price: item.price,
      quantity: item.qty
    }));
    
    // Run user fetch, loyalty settings, and category enrichment in parallel
    const [user, loyaltySettings, itemsForDiscount] = await Promise.all([
      getCurrentUser(),
      getLoyaltySettings(),
      enrichCartItemsWithCategories(cartItemsForDiscount)
    ]);

    // Calculate discounts (after categories are enriched)
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

    // Calculate Loyalty Points (using dynamic settings)
    const pointsEarned = loyaltySettings.enabled ? Math.floor(finalTotal * loyaltySettings.pointsPerEgp) : 0;

    // ========================================
    // FRAUD DETECTION (COD Only) - OPTIMIZED
    // ========================================
    // OPTIMIZATION: Get headers once, outside transaction (reuse from rate limit check)
    const customerIP = headersListForRateLimit.get('x-forwarded-for')?.split(',')[0]?.trim()
      || headersListForRateLimit.get('x-real-ip')
      || 'unknown';

    // Run fraud check in parallel if COD
    let fraudCheckPromise: Promise<FraudCheckResult> | null = null;
    if (input.paymentMethod === 'cod') {
      const { analyzeRisk } = await import('@/lib/services/fraudService');

      fraudCheckPromise = analyzeRisk({
        totalAmount: finalTotal,
        items: input.cartItems.map(i => ({ name: i.name, quantity: i.qty })),
        customerEmail: input.customerEmail,
        userId: user?.id,
        shippingCity: input.shippingCity,
        shippingGovernorate: input.shippingGovernorate,
        ipAddress: customerIP
      });
    }

    // Wait for fraud check if COD
    if (fraudCheckPromise) {
      const fraudAnalysis = await fraudCheckPromise;
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

      // OPTIMIZATION: Get warehouse ID (we only need ID for inventory operations)
      // Use simpler query - just get first active warehouse
      const warehouse = await tx.warehouse.findFirst({
        where: { isActive: true },
        select: { id: true } // Only select ID to reduce data transfer
      });
      if (!warehouse) {
        throw new Error('No active warehouse configured for fulfillment');
      }

      // STEP 1: Verify all products are active and have sufficient stock BEFORE creating order
      // BATCHED QUERY OPTIMIZATION (Audit Requirement 1.1)
      const productIds = input.cartItems.map(i => i.id);
      const variantIds = input.cartItems.filter(i => i.variantId).map(i => i.variantId) as string[];

      const [products, variants, inventoryRecords] = await Promise.all([
        tx.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, status: true, name: true }
        }),
        variantIds.length > 0 ? tx.variant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, sku: true, costPrice: true }
        }) : Promise.resolve([]),
        variantIds.length > 0 ? tx.inventory.findMany({
          where: {
            warehouseId: warehouse.id,
            variantId: { in: variantIds }
          }
        }) : Promise.resolve([])
      ]);

      const productMap = new Map(products.map(p => [p.id, p]));
      const variantMap = new Map(variants.map(v => [v.id, v]));
      const inventoryMap = new Map(inventoryRecords.map(i => [i.variantId, i]));

      const insufficientStockItems: string[] = [];
      const unavailableProducts: string[] = [];
      const variantSkuMap: Record<string, string> = {};
      const variantCostMap: Record<string, number> = {};

      for (const item of input.cartItems) {
        const product = productMap.get(item.id);

        if (!product || product.status !== 'active') {
          unavailableProducts.push(item.name);
          continue;
        }

        if (item.variantId) {
          const variant = variantMap.get(item.variantId);
          if (variant) {
            variantSkuMap[item.variantId] = variant.sku;
            if (variant.costPrice) {
              variantCostMap[item.variantId] = Number(variant.costPrice);
            }
          }

          const inventory = inventoryMap.get(item.variantId);
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
      const initialStatus = (input.paymentMethod === 'wallet' || input.paymentMethod === 'instapay')
        ? OrderStatus.PaymentPending
        : OrderStatus.Pending;

      // Customer IP already fetched outside transaction (optimization)

      // Calculate subtotal (before discounts)
      const subtotalAmount = input.cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

      // Calculate total discount amount
      const totalDiscountAmount = subtotalAmount - finalTotal;

      // OPTIMIZATION: Use shipping cost from input (already calculated on client side)
      // This avoids database query inside transaction
      const shippingCost = new Prisma.Decimal(input.shippingCost ?? 50);

      // variantCostMap already populated in batched loop above

      const newOrder = await tx.order.create({
        data: {
          // CRITICAL: Store all financial components for accurate reporting
          subtotal: new Prisma.Decimal(subtotalAmount),
          discountAmount: new Prisma.Decimal(totalDiscountAmount > 0 ? totalDiscountAmount : 0),
          shippingCost: shippingCost,
          totalPrice: new Prisma.Decimal(finalTotal).add(shippingCost), // Add shipping to total
          status: initialStatus,
          userId: user?.id, // Link to user if logged in
          customerName: `${input.firstName} ${input.lastName}`.trim(),
          firstName: input.firstName,
          lastName: input.lastName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          alternativePhone: input.customerAltPhone || null,
          shippingAddress: input.shippingAddress,
          shippingGovernorate: input.shippingGovernorate,
          shippingCity: input.shippingCity,
          shippingNotes: input.shippingNotes || null,
          paymentMethod: input.paymentMethod,
          paymentPhoneNumber: input.walletNumber || null,
          paymentRef: input.walletReference || null,
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

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

      // STEP 3: Deduct inventory with verification (OPTIMIZED: Batch operations)
      // OPTIMIZATION: Prepare all inventory updates first, then execute in parallel
      const inventoryUpdates: Promise<{ count: number }>[] = [];
      const inventoryItems: Array<{ warehouseId: string; variantId: string; qty: number; name: string }> = [];

      for (const item of input.cartItems) {
        if (!item.variantId) continue;
        
        inventoryItems.push({
          warehouseId: warehouse.id,
          variantId: item.variantId,
          qty: item.qty,
          name: item.name
        });

        if (input.paymentMethod === 'cod') {
          // COD: Deduct immediately from available (no reservation)
          inventoryUpdates.push(
            tx.inventory.updateMany({
              where: {
                warehouseId: warehouse.id,
                variantId: item.variantId,
                available: { gte: item.qty }
              },
              data: {
                available: { decrement: item.qty }
              }
            })
          );
        } else {
          // Online payment: Reserve stock until payment confirmed
          inventoryUpdates.push(
            tx.inventory.updateMany({
              where: {
                warehouseId: warehouse.id,
                variantId: item.variantId,
                available: { gte: item.qty }
              },
              data: {
                available: { decrement: item.qty },
                reserved: { increment: item.qty }
              }
            })
          );
        }
      }

      // Execute all inventory updates in parallel
      const updateResults = await Promise.all(inventoryUpdates);

      // Verify all updates succeeded
      for (let i = 0; i < updateResults.length; i++) {
        if (updateResults[i].count === 0) {
          throw new Error(`Failed to ${input.paymentMethod === 'cod' ? 'deduct' : 'reserve'} inventory for product: ${inventoryItems[i].name}. Insufficient stock.`);
        }
      }

      // NOTE: Inventory logs moved to background task (not critical for order creation)

      return newOrder;
    }, {
      maxWait: 10000, // Increased from 5000 to allow more time to acquire lock
      timeout: 60000 // Increased from 20000 to 60000 (60 seconds) to handle complex transactions
    });

    logger.info(`Order created with shipping: ${order.id}`, {
      orderId: order.id,
      customerEmail: input.customerEmail,
      governorate: input.shippingGovernorate,
      city: input.shippingCity,
      total: finalTotal,
      couponId,
      pointsEarned
    });

    // OPTIMIZATION: Return immediately to redirect user, process non-critical tasks in background
    // This dramatically improves perceived performance
    
    // Handle Payment Method (required before redirect)
    let paymentUrl: string | undefined;

    if (input.paymentMethod === 'wallet' || input.paymentMethod === 'instapay') {
      // Manual Payment Logic (Wallet & InstaPay)
      const provider = input.paymentMethod === 'instapay' ? 'manual_instapay' : 'manual_wallet';
      const referenceString = input.walletReference
        ? `${input.walletReference} (Sender: ${input.walletNumber || 'N/A'})`
        : null;

      await prisma.paymentIntent.create({
        data: {
          orderId: order.id,
          amount: new Prisma.Decimal(finalTotal),
          currency: 'EGP',
          provider: provider,
          providerReference: referenceString,
          status: 'pending',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      logger.info(`Manual Payment Intent created for Order: ${order.id}`, {
        provider,
        reference: input.walletReference,
        sender: input.walletNumber
      });
    }

    // BACKGROUND TASKS: Fire and forget - don't wait for these
    // These run asynchronously and won't block the user redirect
    (async () => {
      try {
        // Create inventory logs (background - not critical)
        const warehouse = await prisma.warehouse.findFirst({
          where: { type: 'MAIN', isActive: true }
        }) || await prisma.warehouse.findFirst({ where: { isActive: true } });

        if (warehouse) {
          for (const item of input.cartItems) {
            if (!item.variantId) continue;
            await prisma.inventoryLog.create({
              data: {
                warehouseId: warehouse.id,
                variantId: item.variantId,
                action: input.paymentMethod === 'cod' ? 'ORDER_FULFILL' : 'ORDER_RESERVE',
                quantity: -item.qty,
                reason: `${input.paymentMethod === 'cod' ? 'COD' : 'Online'} Order Created: ${order.id}`,
                referenceId: order.id,
              }
            }).catch(err => logger.error('Failed to create inventory log', { orderId: order.id, error: err }));
          }
        }

        // Send confirmation email for ALL orders (background)
        const itemsSubtotal = input.cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
        await sendOrderConfirmationEmail({
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: `${input.firstName} ${input.lastName}`.trim(),
            customerEmail: input.customerEmail,
            items: input.cartItems.map(item => ({
              name: item.name,
              quantity: item.qty,
              price: item.price
            })),
            subtotal: itemsSubtotal,
            shipping: Number(order.shippingCost || 0),
            total: Number(order.totalPrice),
            shippingAddress: `${input.shippingAddress}, ${input.shippingCity}, ${input.shippingGovernorate}`,
            paymentMethod: input.paymentMethod
          }).catch(err => logger.error('Failed to send confirmation email', { orderId: order.id, error: err }));

        // Revalidate admin orders page (background)
        revalidatePath('/admin/orders');
      } catch (err) {
        // Log errors but don't fail the order
        logger.error('Background task error', { orderId: order.id, error: err });
      }
    })();
    
    // RETURN IMMEDIATELY - User gets redirected right away!
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
      } else {
        // FALLBACK DEBUGGING: Include actual error message
        errorMessage = `An error occurred: ${error.message}`;
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}


