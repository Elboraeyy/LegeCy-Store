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
    quantity: number
  ) {
    // Atomic Check & Update
    const result = await tx.inventory.updateMany({
        where: {
            warehouseId,
            variantId,
            available: { gte: quantity } // Atomic Check: "Is available >= qty?"
        },
        data: {
            available: { decrement: quantity },
            reserved: { increment: quantity }
        }
    });

    if (result.count === 0) {
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
    logger.debug(`Reserved stock`, { quantity, variantId, warehouseId });
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

    // Atomic Update
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
  }
};
