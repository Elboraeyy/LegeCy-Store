'use server';

/**
 * Order Lifecycle Service
 * 
 * This is the NEURAL CENTER for order events.
 * Every order state change triggers financial and inventory effects.
 * 
 * Flow:
 * Order Status Change → Trigger Financial Events
 * ├── CONFIRMED → Reserve inventory (no revenue yet)
 * ├── PAID → Record cash receipt
 * ├── SHIPPED → Update tracking
 * ├── DELIVERED → Recognize revenue + COGS
 * ├── CANCELLED → Release inventory, reverse entries
 * └── REFUNDED → Reversing journal entry, return inventory
 */

import prisma from '@/lib/prisma';
import { revenueService } from './revenueService';
import { Decimal } from '@prisma/client/runtime/library';

// Event types for order lifecycle
export type OrderEventType = 
  | 'CREATED'
  | 'CONFIRMED'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

interface OrderEventInput {
  orderId: string;
  eventType: OrderEventType;
  fromStatus?: string;
  toStatus?: string;
  amount?: number;
  reason?: string;
  triggeredBy?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Record an order event and trigger appropriate side effects
 */
export async function recordOrderEvent(input: OrderEventInput) {
  const { orderId, eventType, fromStatus, toStatus, amount, reason, triggeredBy, metadata } = input;
  
  // 1. Create event record for audit trail
  const event = await prisma.orderEvent.create({
    data: {
      orderId,
      eventType,
      fromStatus,
      toStatus,
      amount: amount ? new Decimal(amount) : null,
      reason,
      triggeredBy,
      metadata: metadata as object | undefined,
    }
  });
  
  // 2. Trigger side effects based on event type
  switch (eventType) {
    case 'PAID':
      await onOrderPaid(orderId);
      break;
    case 'DELIVERED':
      await onOrderDelivered(orderId, triggeredBy);
      break;
    case 'CANCELLED':
      await onOrderCancelled(orderId, triggeredBy, reason);
      break;
    case 'REFUNDED':
      await onOrderRefunded(orderId, amount || 0, triggeredBy, reason);
      break;
  }
  
  return event;
}

/**
 * Handle PAID event - Record cash receipt
 */
async function onOrderPaid(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { variant: true } } }
  });
  
  if (!order) return;
  
  // For non-COD orders, cash is received immediately
  // For COD, cash is received on delivery
  if (order.paymentMethod !== 'cod') {
    // TODO: Create journal entry for cash receipt
    // DR Cash, CR Deferred Revenue (we'll recognize on delivery)
    console.log(`[OrderLifecycle] Cash received for order ${orderId}: ${order.totalPrice}`);
  }
}

/**
 * Handle DELIVERED event - Recognize revenue and COGS
 * This is the KEY financial event
 */
async function onOrderDelivered(orderId: string, triggeredBy?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { 
      items: { include: { variant: true } },
      revenueRecognition: true 
    }
  });
  
  if (!order) return;
  
  // Skip if already recognized
  if (order.revenueRecognition) {
    console.log(`[OrderLifecycle] Revenue already recognized for order ${orderId}`);
    return;
  }
  
  // Calculate values
  const grossRevenue = Number(order.totalPrice);
  const discountAmount = 0; // TODO: Calculate from coupon
  const netRevenue = grossRevenue - discountAmount;
  
  // Calculate COGS from item costs
  let cogsAmount = 0;
  for (const item of order.items) {
    const costPrice = Number(item.variant?.costPrice || 0);
    cogsAmount += costPrice * item.quantity;
  }
  
  const grossProfit = netRevenue - cogsAmount;
  
  // Create revenue recognition record
  const revenueRecog = await prisma.revenueRecognition.create({
    data: {
      orderId,
      grossRevenue: new Decimal(grossRevenue),
      discountAmount: new Decimal(discountAmount),
      netRevenue: new Decimal(netRevenue),
      cogsAmount: new Decimal(cogsAmount),
      grossProfit: new Decimal(grossProfit),
      recognizedBy: triggeredBy || 'system'
    }
  });
  
  // Create journal entries for revenue and COGS
  await revenueService.recognizeRevenue(orderId, netRevenue, cogsAmount);
  
  console.log(`[OrderLifecycle] Revenue recognized for order ${orderId}: Revenue=${netRevenue}, COGS=${cogsAmount}, Profit=${grossProfit}`);
  
  return revenueRecog;
}

/**
 * Handle CANCELLED event - Release reserved inventory
 */
async function onOrderCancelled(orderId: string, triggeredBy?: string, reason?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { 
      items: { include: { variant: true } },
      revenueRecognition: true 
    }
  });
  
  if (!order) return;
  
  // If revenue was already recognized, we need to reverse it
  if (order.revenueRecognition) {
    await revenueService.reverseRevenue(orderId, reason || 'Order cancelled');
    
    // Delete the revenue recognition record
    await prisma.revenueRecognition.delete({
      where: { orderId }
    });
  }
  
  // TODO: Release reserved inventory
  console.log(`[OrderLifecycle] Order ${orderId} cancelled. Reason: ${reason}`);
}

/**
 * Handle REFUNDED event - Create reversing journal entries
 */
async function onOrderRefunded(orderId: string, refundAmount: number, triggeredBy?: string, reason?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { 
      items: { include: { variant: true } },
      revenueRecognition: true 
    }
  });
  
  if (!order) return;
  
  // Calculate refund as percentage of order
  const orderTotal = Number(order.totalPrice);
  const refundPercentage = orderTotal > 0 ? refundAmount / orderTotal : 0;
  
  // If revenue was recognized, we need to reverse proportionally
  if (order.revenueRecognition) {
    const revenueToReverse = Number(order.revenueRecognition.netRevenue) * refundPercentage;
    const cogsToReverse = Number(order.revenueRecognition.cogsAmount) * refundPercentage;
    
    await revenueService.createRefundEntry(orderId, revenueToReverse, cogsToReverse, reason);
    
    // Update the revenue recognition to reflect partial refund
    await prisma.revenueRecognition.update({
      where: { orderId },
      data: {
        netRevenue: { decrement: new Decimal(revenueToReverse) },
        cogsAmount: { decrement: new Decimal(cogsToReverse) },
        grossProfit: { decrement: new Decimal(revenueToReverse - cogsToReverse) }
      }
    });
  }
  
  console.log(`[OrderLifecycle] Order ${orderId} refunded: ${refundAmount}. Reason: ${reason}`);
}

/**
 * Get order event history
 */
export async function getOrderEvents(orderId: string) {
  return prisma.orderEvent.findMany({
    where: { orderId },
    orderBy: { createdAt: 'asc' }
  });
}

/**
 * Check if order has been revenue-recognized
 */
export async function isRevenueRecognized(orderId: string): Promise<boolean> {
  const recognition = await prisma.revenueRecognition.findUnique({
    where: { orderId }
  });
  return !!recognition;
}
