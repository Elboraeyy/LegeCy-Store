'use server';

import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { trackJobExecution, sendAlert, checkReconciliationHealth } from '@/lib/monitoring';

/**
 * Reconciliation Jobs
 * 
 * Critical jobs for maintaining system integrity:
 * 1. Payment Intent Reconciliation - Match orders with payments
 * 2. Inventory Reconciliation - Fix stock mismatches
 * 3. Order Status Reconciliation - Handle stuck orders
 * 
 * These should run on a schedule (e.g., every 15 minutes via Vercel Cron or external scheduler)
 */

// ============================================
// JOB EXECUTION TRACKING
// ============================================

interface JobResult {
  success: boolean;
  itemsProcessed: number;
  issues: string[];
  duration: number;
}

// ============================================
// 1. PAYMENT INTENT RECONCILIATION
// ============================================

/**
 * Reconcile payment intents with orders
 * - Find pending intents older than 30 minutes
 * - Mark expired ones and release inventory
 * - Alert on anomalies
 */
export async function reconcilePaymentIntents(): Promise<JobResult> {
  const startTime = Date.now();
  const issues: string[] = [];
  let itemsProcessed = 0;

  try {
    // Find stale pending payment intents (older than 30 min)
    const staleIntents = await prisma.paymentIntent.findMany({
      where: {
        status: 'pending',
        createdAt: { lt: new Date(Date.now() - 30 * 60 * 1000) }
      },
      include: { order: true }
    });

    logger.info(`Reconciliation: Found ${staleIntents.length} stale payment intents`);

    for (const intent of staleIntents) {
      try {
        await prisma.$transaction(async (tx) => {
          // Mark intent as expired
          await tx.paymentIntent.update({
            where: { id: intent.id },
            data: { status: 'expired' }
          });

          // Update order status
          await tx.order.update({
            where: { id: intent.orderId },
            data: { status: 'payment_failed' }
          });

          // Release reserved inventory
          const warehouse = await tx.warehouse.findFirst();
          if (warehouse && intent.order) {
            const orderItems = await tx.orderItem.findMany({
              where: { orderId: intent.orderId }
            });

            for (const item of orderItems) {
              if (item.variantId) {
                await tx.inventory.updateMany({
                  where: { warehouseId: warehouse.id, variantId: item.variantId },
                  data: { 
                    reserved: { decrement: item.quantity },
                    available: { increment: item.quantity }
                  }
                });
              }
            }
          }

          // Log
          await tx.orderStatusHistory.create({
            data: {
              orderId: intent.orderId,
              from: 'pending',
              to: 'payment_failed',
              reason: 'Payment intent expired (reconciliation)'
            }
          });
        });

        itemsProcessed++;
      } catch (e) {
        issues.push(`Failed to reconcile intent ${intent.id}: ${e}`);
        logger.error('Reconciliation error for payment intent', { intentId: intent.id, error: e });
      }
    }

    // Note: Orphaned intent check removed since orderId is required in PaymentIntent schema

    const duration = Date.now() - startTime;
    await trackJobExecution('reconcile_payment_intents', issues.length === 0, duration);

    return { success: true, itemsProcessed, issues, duration };

  } catch (e) {
    const duration = Date.now() - startTime;
    const error = e instanceof Error ? e.message : String(e);
    await trackJobExecution('reconcile_payment_intents', false, duration, error);
    return { success: false, itemsProcessed, issues: [...issues, error], duration };
  }
}

// ============================================
// 2. INVENTORY RECONCILIATION
// ============================================

/**
 * Check and fix inventory mismatches
 * - Find negative stock (should never happen)
 * - Find orphaned reservations
 * - Alert on anomalies
 */
export async function reconcileInventory(): Promise<JobResult> {
  const startTime = Date.now();
  const issues: string[] = [];
  let itemsProcessed = 0;

  try {
    // Find negative available stock (critical issue)
    const negativeStock = await prisma.inventory.findMany({
      where: { available: { lt: 0 } },
      include: { variant: { include: { product: true } } }
    });

    if (negativeStock.length > 0) {
      await sendAlert({
        type: 'INVENTORY_MISMATCH',
        severity: 'critical',
        message: `${negativeStock.length} items have negative stock!`,
        details: { 
          items: negativeStock.map(i => ({
            variantId: i.variantId,
            productName: i.variant?.product?.name,
            available: i.available
          }))
        }
      });

      // Fix by setting to 0 (log the correction)
      for (const item of negativeStock) {
        await prisma.$transaction(async (tx) => {
          const correction = Math.abs(Number(item.available));
          
          await tx.inventory.update({
            where: { id: item.id },
            data: { available: 0 }
          });

          await tx.inventoryLog.create({
            data: {
              warehouseId: item.warehouseId,
              variantId: item.variantId,
              action: 'ADJUSTMENT',
              quantity: correction,
              reason: `Reconciliation: Fixed negative stock (was -${correction})`,
              referenceId: 'SYSTEM_RECONCILIATION'
            }
          });
        });

        itemsProcessed++;
        issues.push(`Fixed negative stock for variant ${item.variantId}`);
      }
    }

    // Find orphaned reservations (orders completed/cancelled but stock still reserved)
    const reservedInventory = await prisma.inventory.findMany({
      where: { reserved: { gt: 0 } }
    });

    for (const inv of reservedInventory) {
      // Check if there are any pending orders for this variant
      const pendingOrders = await prisma.orderItem.count({
        where: {
          variantId: inv.variantId,
          order: {
            status: { in: ['pending', 'processing'] },
            paymentMethod: { in: ['paymob', 'wallet'] } // Only online payments have reservations
          }
        }
      });

      // If no pending orders but stock is reserved, release it
      if (pendingOrders === 0 && Number(inv.reserved) > 0) {
        await prisma.$transaction(async (tx) => {
          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              available: { increment: Number(inv.reserved) },
              reserved: 0
            }
          });

          await tx.inventoryLog.create({
            data: {
              warehouseId: inv.warehouseId,
              variantId: inv.variantId,
              action: 'ADJUSTMENT',
              quantity: Number(inv.reserved),
              reason: 'Reconciliation: Released orphaned reservation',
              referenceId: 'SYSTEM_RECONCILIATION'
            }
          });
        });

        itemsProcessed++;
        issues.push(`Released orphaned reservation for variant ${inv.variantId}: ${inv.reserved} units`);
      }
    }

    const duration = Date.now() - startTime;
    await trackJobExecution('reconcile_inventory', true, duration);

    return { success: true, itemsProcessed, issues, duration };

  } catch (e) {
    const duration = Date.now() - startTime;
    const error = e instanceof Error ? e.message : String(e);
    await trackJobExecution('reconcile_inventory', false, duration, error);
    return { success: false, itemsProcessed, issues: [...issues, error], duration };
  }
}

// ============================================
// 3. ORDER STATUS RECONCILIATION
// ============================================

/**
 * Handle stuck orders
 * - Orders pending for too long
 * - Orders in processing but never shipped
 */
export async function reconcileOrderStatus(): Promise<JobResult> {
  const startTime = Date.now();
  const issues: string[] = [];
  let itemsProcessed = 0;

  try {
    // Find COD orders pending for > 24 hours (should have been processed)
    const stuckCODOrders = await prisma.order.findMany({
      where: {
        status: 'pending',
        paymentMethod: 'cod',
        createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });

    if (stuckCODOrders.length > 10) {
      await sendAlert({
        type: 'ORDER_ANOMALY',
        severity: 'warning',
        message: `${stuckCODOrders.length} COD orders stuck in pending for > 24h`,
        details: { count: stuckCODOrders.length }
      });
      issues.push(`${stuckCODOrders.length} stuck COD orders`);
    }

    // Find orders in processing for > 3 days (should have shipped)
    const stuckProcessing = await prisma.order.findMany({
      where: {
        status: 'processing',
        createdAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
      }
    });

    if (stuckProcessing.length > 0) {
      await sendAlert({
        type: 'ORDER_ANOMALY',
        severity: 'warning',
        message: `${stuckProcessing.length} orders stuck in processing for > 3 days`,
        details: { 
          orderIds: stuckProcessing.slice(0, 10).map(o => o.id)
        }
      });
      issues.push(`${stuckProcessing.length} orders stuck in processing`);
    }

    itemsProcessed = stuckCODOrders.length + stuckProcessing.length;

    const duration = Date.now() - startTime;
    await trackJobExecution('reconcile_order_status', true, duration);

    return { success: true, itemsProcessed, issues, duration };

  } catch (e) {
    const duration = Date.now() - startTime;
    const error = e instanceof Error ? e.message : String(e);
    await trackJobExecution('reconcile_order_status', false, duration, error);
    return { success: false, itemsProcessed, issues: [...issues, error], duration };
  }
}

// ============================================
// MASTER RECONCILIATION JOB
// ============================================

/**
 * Run all reconciliation jobs
 * Call this from a cron endpoint or scheduled trigger
 */
export async function runAllReconciliation(): Promise<{
  paymentIntents: JobResult;
  inventory: JobResult;
  orderStatus: JobResult;
  overallSuccess: boolean;
}> {
  const startTime = Date.now();
  
  logger.info('Starting reconciliation jobs...');

  const [paymentIntents, inventory, orderStatus] = await Promise.all([
    reconcilePaymentIntents(),
    reconcileInventory(),
    reconcileOrderStatus()
  ]);

  const overallSuccess = paymentIntents.success && inventory.success && orderStatus.success;

  // Track master job
  await trackJobExecution('reconciliation', overallSuccess, Date.now() - startTime);

  logger.info(`Reconciliation complete in ${Date.now() - startTime}ms`, {
    paymentIntents: paymentIntents.success,
    inventory: inventory.success,
    orderStatus: orderStatus.success
  });

  return { paymentIntents, inventory, orderStatus, overallSuccess };
}

/**
 * Health check for reconciliation system
 */
export async function getReconciliationHealth(): Promise<{
  healthy: boolean;
  lastRun: string | null;
  warnings: string[];
}> {
  const healthy = await checkReconciliationHealth();
  const warnings: string[] = [];

  // Check for critical issues
  const negativeStock = await prisma.inventory.count({
    where: { available: { lt: 0 } }
  });
  if (negativeStock > 0) {
    warnings.push(`${negativeStock} items with negative stock`);
  }

  const staleIntents = await prisma.paymentIntent.count({
    where: {
      status: 'pending',
      createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) }
    }
  });
  if (staleIntents > 0) {
    warnings.push(`${staleIntents} stale payment intents (>1h)`);
  }

  return {
    healthy: healthy && warnings.length === 0,
    lastRun: null, // Would come from tracking
    warnings
  };
}
