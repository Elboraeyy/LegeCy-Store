import prisma from '@/lib/prisma';
import { Prisma, Order as PrismaOrder, OrderItem as PrismaOrderItem, User as PrismaUser } from '@prisma/client';
import { OrderStatus } from '@/lib/orderStatus';
import { Order } from '@/types/order';
import { inventoryService } from './inventoryService';
import { validateOrderTransition, ActorRole } from '@/lib/policies/orderPolicy';
import { auditService } from './auditService';
import { logger } from '@/lib/logger';
import { OrderNotFoundError, InventoryError, ValidationError } from '@/lib/errors';
import { createOrderSchema } from '@/lib/validators/order';
import { z } from 'zod';

export type CreateOrderServiceParams = z.infer<typeof createOrderSchema>;

// Helper to get default warehouse.
export async function getDefaultWarehouseId(tx: Prisma.TransactionClient) {
    const warehouse = await tx.warehouse.findFirst();
    if (!warehouse) {
      logger.error('No warehouse configured in database');
      throw new InventoryError("No warehouse configured.");
    }
    return warehouse.id;
}

/**
 * Creates an order and strictly reserves stock in a single transaction.
 */
export async function createOrder(input: CreateOrderServiceParams): Promise<Order> {
    // 1. Validate Input (Double check if service called directly)
    const validation = createOrderSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationError('Invalid order data', validation.error.flatten().fieldErrors);
    }
    const data = validation.data;

    return await prisma.$transaction(async (tx) => {
        const warehouseId = await getDefaultWarehouseId(tx);

        // 2. Reserve Stock (Fail fast)
        if (!data.options?.skipReservation) {
            for (const item of data.items) {
                 if (item.variantId) {
                     await inventoryService.reserveStock(tx, warehouseId, item.variantId, item.quantity);
                 } else {
                   logger.warn(`Order item ${item.name} has no variantId, skipping reservation.`, { productId: item.productId });
                 }
            }
        }

        // 3. Create Order
        const order = await tx.order.create({
            data: {
                totalPrice: new Prisma.Decimal(data.totalPrice),
                status: OrderStatus.Pending,
                userId: data.userId, // Link order to user
                paymentMethod: data.paymentMethod || 'cod',
                items: {
                    create: data.items.map(item => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        name: item.name,
                        price: new Prisma.Decimal(item.price),
                        quantity: item.quantity
                    }))
                }
            },
            include: { items: true }
        });

        logger.info(`Order created: ${order.id}`, { totalPrice: data.totalPrice, itemsCount: data.items.length, orderId: order.id });

        // 4. Return mapped order (Ensure types match)
        return mapToOrderType(order);
    });
}

export async function updateOrderStatus(
    orderId: string, 
    newStatus: OrderStatus, 
    actor: ActorRole = 'system', 
    actorId?: string 
): Promise<Order> {
  // Validate Actor ID for Admins
  if (actor === 'admin' && !actorId) {
      throw new ValidationError('Admin actions require an actorId for audit purposes.');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new OrderNotFoundError(orderId);
  }

  const currentStatus = order.status as OrderStatus;

  // Validate Transition & Policy
  validateOrderTransition(currentStatus, newStatus, actor);

  const updatedOrder = await prisma.$transaction(async (tx) => {
      // PROXY TO INTERNAL CANCEL if status is Cancelled
      if (newStatus === OrderStatus.Cancelled) {
          return await internalCancelOrder(tx, orderId, `Cancelled by ${actor}`);
      }

      // Commit inventory for online payment orders when paid
      // Note: COD orders deduct inventory immediately at order creation (checkout.ts)
      if (newStatus === OrderStatus.Paid && order.paymentMethod !== 'cod') {
          const warehouseId = await getDefaultWarehouseId(tx);
          for (const item of order.items) {
              if (item.variantId) {
                  // Commit stock: remove from reserved (already deducted from available during reservation)
                  await inventoryService.commitStock(tx, warehouseId, item.variantId, item.quantity, newStatus);
                  
                  // Log the inventory change for tracking
                  await tx.inventoryLog.create({
                      data: {
                          warehouseId,
                          variantId: item.variantId,
                          action: 'ORDER_FULFILL',
                          quantity: -item.quantity,
                          reason: `Online Order Paid: ${orderId}`,
                          referenceId: orderId,
                      }
                  });
              }
          }
          logger.info(`Inventory committed for order`, { orderId, itemCount: order.items.length, paymentMethod: order.paymentMethod });
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { 
          status: newStatus,
          // Set deliveredAt when order is delivered for accurate return window
          ...(newStatus === OrderStatus.Delivered && { deliveredAt: new Date() })
        },
        include: { items: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          from: currentStatus,
          to: newStatus,
          reason: `Status update by ${actor}`
        },
      });

      // Audit Logging
      if (actor === 'admin' && actorId) {
          await auditService.logAction(
              actorId, 
              'UPDATE_ORDER_STATUS', 
              'ORDER', 
              orderId, 
              { from: currentStatus, to: newStatus },
              null, // ipAddress - not available in service layer
              null, // userAgent - not available in service layer
              tx
          );
      }

      return updated;
  });

  logger.info(`Order status updated`, { orderId, oldStatus: currentStatus, newStatus, actor });
  return mapToOrderType(updatedOrder);
}

/**
 * THE Single Source of Truth for order cancellation.
 * @internal This should only be used by internal services.
 */
export async function internalCancelOrder(tx: Prisma.TransactionClient, orderId: string, reason: string) {
    const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
    });

    if (!order) throw new OrderNotFoundError(orderId);
    
    // Idempotency check
    if ((order.status as OrderStatus) === OrderStatus.Cancelled) {
        logger.warn(`Attempted to cancel already cancelled order`, { orderId });
        return order; 
    }

    const warehouseId = await getDefaultWarehouseId(tx);
    const currentStatus = order.status as OrderStatus;

    // 2. Release/Return Stock based on payment method and status
    const isCOD = order.paymentMethod === 'cod';
    
    if (currentStatus === OrderStatus.Pending) {
        for (const item of order.items) {
             if (item.variantId) {
                 if (isCOD) {
                     // COD orders: stock was deducted from available, return it
                     await tx.inventory.update({
                         where: { warehouseId_variantId: { warehouseId, variantId: item.variantId } },
                         data: { available: { increment: item.quantity } }
                     });
                 } else {
                     // Online orders: stock was reserved, release it
                     await inventoryService.releaseStock(tx, warehouseId, item.variantId, item.quantity);
                 }
             }
        }
    } 
    else if (currentStatus === OrderStatus.Paid || currentStatus === OrderStatus.Shipped) {
        // Stock was committed (deducted), return to available
        for (const item of order.items) {
             if (item.variantId) {
                  await tx.inventory.update({
                      where: { warehouseId_variantId: { warehouseId, variantId: item.variantId } },
                      data: { available: { increment: item.quantity } }
                  });
             }
        }
    }

    // 3. Update Status
    const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.Cancelled },
        include: { items: true }
    });

    // 4. Log History
    await tx.orderStatusHistory.create({
        data: {
            orderId,
            from: currentStatus,
            to: OrderStatus.Cancelled,
            reason: reason 
        } 
    });

    logger.info(`Order cancelled`, { orderId, reason });
    return updatedOrder;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  sortBy?: 'newest' | 'oldest';
  search?: string;
  dateRange?: { from: Date; to: Date };
}

export interface OrdersResponse {
  data: Order[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getOrderForAdmin(orderId: string) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true, items: true, history: { orderBy: { createdAt: 'desc' }} }
    });

    return order ? mapToOrderType(order) : null;
}

export async function getOrders({ page = 1, limit = 10, status, sortBy = 'newest', search, dateRange }: GetOrdersParams): Promise<OrdersResponse> {
  const skip = (Math.max(1, page) - 1) * limit; 
  
  const where: Prisma.OrderWhereInput = {
    // Exclude payment-related pending/failed orders from main list
    // These are shown in a separate "Failed Payments" section
    status: { notIn: [OrderStatus.PaymentPending, OrderStatus.PaymentFailed] }
  };
  
  // If specific status filter provided, use it instead
  if (status) where.status = status;
  
  if (search) {
     where.OR = [
         { id: { contains: search } },
         { user: { email: { contains: search } } },
         { user: { name: { contains: search } } }
     ];
  }

  if (dateRange) {
    where.createdAt = {
      gte: dateRange.from,
      lte: dateRange.to
    };
  }

  const orderBy = { createdAt: sortBy === 'oldest' ? 'asc' : 'desc' } as const;

  const [total, orders] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { 
        items: true,
        user: { select: { name: true, email: true } }
      },
    }),
  ]);

  return {
    data: orders.map(mapToOrderType),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Strict Type Mapping
type PrismaOrderWithRelations = PrismaOrder & {
    items: PrismaOrderItem[];
    user?: Partial<PrismaUser> | null;
};

function mapToOrderType(prismaOrder: PrismaOrderWithRelations): Order {
    return {
        id: prismaOrder.id,
        totalPrice: prismaOrder.totalPrice instanceof Prisma.Decimal ? prismaOrder.totalPrice.toNumber() : Number(prismaOrder.totalPrice),
        status: prismaOrder.status as OrderStatus,
        createdAt: prismaOrder.createdAt instanceof Date ? prismaOrder.createdAt.toISOString() : String(prismaOrder.createdAt),
        items: prismaOrder.items.map(mapToOrderItem),
        // userId property does not exist in our Order type definition
        user: prismaOrder.user ? {
            name: prismaOrder.user.name ?? null,
            email: prismaOrder.user.email ?? null
        } : undefined
    };
}

function mapToOrderItem(item: PrismaOrderItem) {
    return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId, // already string | null
        name: item.name,
        price: item.price instanceof Prisma.Decimal ? item.price.toNumber() : Number(item.price),
        quantity: item.quantity
    };
}
