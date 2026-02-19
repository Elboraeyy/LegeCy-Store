import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { INVENTORY_POLICIES } from '@/lib/policies/inventoryPolicy';
import { OrderStatus } from '@/lib/orderStatus';
import { InventoryError, InsufficientStockError } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * Service to handle Inventory operations within a transaction.
 * All methods accept a Prisma Transaction Client (tx) to ensure atomicity.
 */
export const inventoryService = {
  /**
   * Reserves stock for a specific variant.
   * Moves stock from 'available' to 'reserved'.
   * @throws InventoryError if DB constraints are violated (e.g., negative availability).
   */
  async reserveStock(
    tx: Prisma.TransactionClient,
    warehouseId: string,
    variantId: string,
    quantity: number,
    force: boolean = false
  ) {
    // Atomic Check & Update
    const whereClause: Prisma.InventoryWhereInput = {
      warehouseId,
      variantId,
    };

    // If NOT forced, enforce strict availability
    if (!force) {
      whereClause.available = { gte: quantity };
    }

    const result = await tx.inventory.updateMany({
      where: whereClause,
      data: {
        available: { decrement: quantity },
        reserved: { increment: quantity }
      }
    });

    if (result.count === 0) {
      // If forced, it might fail because the RECORD doesn't exist. Attempt to create it.
      if (force) {
        logger.warn(`Forced reservation: Inventory record missing for ${variantId}. Creating new record with negative availability.`);
        // We can't use updateMany to create. We use upsert.
        // But valid "where" for upsert needs unique constraint.
        await tx.inventory.upsert({
          where: { warehouseId_variantId: { warehouseId, variantId } },
          create: {
            warehouseId,
            variantId,
                 available: -quantity,
                 reserved: quantity,
               },
               update: {
                 available: { decrement: quantity },
                 reserved: { increment: quantity }
               }
             });
          logger.info(`Forced reservation success (via upsert) for ${variantId}`);
          return;
        }

        // Optional: Fetch actual stock to give better error message
        const current = await tx.inventory.findUnique({
            where: { warehouseId_variantId: { warehouseId, variantId } }
        });
        
        if (!current) {
             logger.error(`Stock reservation failed: Inventory record not found`, { variantId, warehouseId });
             throw new InventoryError(`Inventory record not found for variant ${variantId}`);
        }
        
        logger.warn(`Stock reservation failed: Insufficient stock`, { variantId, requested: quantity, available: current.available });
        throw new InsufficientStockError(variantId, quantity, current.available);
    }
    logger.debug(`Reserved stock ${force ? '(FORCED)' : ''}`, { quantity, variantId, warehouseId });
  },

  /**
   * Commits reserved stock (e.g. when Order is Paid).
   * Removes stock from 'reserved'. It is now technically 'sold' / 'outbound'.
   */
  async commitStock(
    tx: Prisma.TransactionClient,
    warehouseId: string,
    variantId: string,
    quantity: number,
    orderStatus?: OrderStatus 
  ) {
    if (orderStatus) {
        INVENTORY_POLICIES.requirePaymentForCommit(orderStatus);
    }

    // 1. Update Aggregate Inventory (Fast & Atomic)
    const result = await tx.inventory.updateMany({
        where: {
             warehouseId,
             variantId,
             reserved: { gte: quantity }
        },
        data: {
          reserved: { decrement: quantity },
        },
    });

    if (result.count === 0) {
        logger.error(`Stock commit failed: Insufficient reserved stock`, { variantId, warehouseId });
        throw new InventoryError(`Stock reservation expired or invalid for variant ${variantId}`);
    }

    // 2. FIFO Batch Depletion (The Audit Fix)
    // We must deplete specific batches to track cost and expiry accurately.
    // Rule: First Expiring First Out (FEFO), then First In First Out (FIFO)

    const batches = await tx.inventoryBatch.findMany({
      where: {
        variantId,
        remainingQuantity: { gt: 0 },
        stockIn: { warehouseId } // Filter by warehouse via relation
      },
      orderBy: [
        { expiryDate: 'asc' }, // Prioritize expiring soon (nulls last usually, but standard SQL behavior varies. We assume explicit dates come first if sorted ASC with nulls last, or we check)
        { createdAt: 'asc' }   // Fallback to oldest batch
      ]
    });

    let remainingToDeduck = quantity;

    for (const batch of batches) {
      if (remainingToDeduck <= 0) break;

      const deduct = Math.min(batch.remainingQuantity, remainingToDeduck);

      await tx.inventoryBatch.update({
        where: { id: batch.id },
        data: { remainingQuantity: { decrement: deduct } }
      });

      remainingToDeduck -= deduct;
    }

    if (remainingToDeduck > 0) {
      // Critical Data Integrity Issue: Aggregate inventory said we had stock, but Batches didn't.
      // This "Split Brain" means we sold ghost inventory (or unmapped inventory).

      // FORCE COMMIT: We allow this to proceed to avoid blocking operations, but we log strictly.
      logger.warn(`[DATA_INTEGRITY] Inventory Batch Mismatch. Committed ${quantity} but only found batches for ${quantity - remainingToDeduck}. Variance: ${remainingToDeduck}. Proceeding with aggregate-only deduction.`, {
        variantId,
        warehouseId,
        missingQty: remainingToDeduck
      });

      // Send critical alert to admins (non-blocking)
      import('./alertService').then(({ sendBatchMismatchAlert }) => {
        sendBatchMismatchAlert(variantId, warehouseId, remainingToDeduck).catch(() => { });
      }).catch(() => { });

      // DO NOT THROW. Proceed. The aggregate inventory `reserved` was already deducted above, so we are "safe" regarding double-spending.
      // We just have accurate aggregate and inaccurate batches.
      return;
    }

    logger.debug(`Committed stock`, { quantity, variantId, warehouseId });
  },

  /**
   * Releases stock (e.g. when Order is Cancelled).
   * Moves stock back from 'reserved' to 'available'.
   */
  async releaseStock(
      tx: Prisma.TransactionClient,
      warehouseId: string,
      variantId: string,
      quantity: number
  ) {
    try {
        await tx.inventory.update({
            where: {
                 warehouseId_variantId: {
                  warehouseId,
                  variantId
              }
            },
            data: {
                reserved: { decrement: quantity },
                available: { increment: quantity }
            }
        });
        logger.debug(`Released stock`, { quantity, variantId, warehouseId });
    } catch (error: unknown) {
        logger.error(`Stock release failed`, { variantId, error });
        throw new InventoryError(`Cannot release stock: Database error or invalid state.`);
    }
  },

  /**
   * Increases stock (e.g. Stock Transfer Receipt, Purchase Order).
   * Adds to 'available'.
   */
  async increaseStock(
    tx: Prisma.TransactionClient,
    warehouseId: string,
    variantId: string,
    quantity: number
  ) {
    await tx.inventory.upsert({
      where: { warehouseId_variantId: { warehouseId, variantId } },
      update: { available: { increment: quantity } },
      create: {
        warehouseId,
        variantId,
        available: quantity,
        reserved: 0
      }
    });
    logger.debug(`Increased stock`, { quantity, variantId, warehouseId });

    // Fire Event via Event Bus
    try {
      const { eventBus, EVENTS } = await import('@/lib/eventBus');
      eventBus.emit(EVENTS.INVENTORY.STOCK_INCREASED, { variantId });
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      logger.warn('Could not emit stock event', { error: err.message });
    }
  },

  async getInventoryByWarehouse(warehouseId: string) {
    return await prisma.inventory.findMany({
      where: { warehouseId, available: { gt: 0 } },
      include: {
        variant: {
          include: {
            product: {
              include: { images: true }
            }
          }
        }
      }
    }).then(items => items.map(item => ({
      variantId: item.variantId,
      sku: item.variant.sku,
      productName: item.variant.product.name,
      productImage: item.variant.product.images[0]?.url || null, // ProductImage model has url. Product has images[]
      available: item.available,
      reserved: item.reserved
    })));
  },

  /**
   * Helper to get the primary warehouse (type='MAIN') or fallback to any.
   */
  async getPrimaryWarehouse(tx: Prisma.TransactionClient): Promise<string | undefined> {
    const w = await tx.warehouse.findFirst({ where: { type: 'MAIN' } }) || await tx.warehouse.findFirst();
    return w?.id;
  },

  /**
   * Finas a warehouse that has enough RESERVED stock for a variant.
   * Used for recovery when we don't know where the stock was reserved.
   */
  async findWarehouseWithReservation(
    tx: Prisma.TransactionClient,
    variantId: string,
    quantity: number
  ): Promise<string | null> {
    const inventory = await tx.inventory.findFirst({
      where: {
        variantId,
        reserved: { gte: quantity }
      },
      select: { warehouseId: true }
    });
    return inventory?.warehouseId || null;
  }
};
