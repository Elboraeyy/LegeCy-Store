import prisma from '@/lib/prisma';
import { Prisma, Order as PrismaOrder, OrderItem as PrismaOrderItem, User as PrismaUser } from '@prisma/client';
import { OrderStatus } from '@/lib/orderStatus';
import { Order } from '@/types/order';
import { inventoryService } from './inventoryService';
import { InventoryError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { ActorRole } from '@/lib/policies/orderPolicy';
import { createOrderSchema } from '@/lib/validators/order';
import { z } from 'zod';
import { resolveDefaultVariantsMap } from '@/lib/products/resolve-default-variant';
import { generateNextOrderNumber } from '@/lib/utils/orderNumberGenerator';

export type CreateOrderServiceParams = z.infer<typeof createOrderSchema>;

// Helper to get default warehouse.
export async function getDefaultWarehouseId(tx: Prisma.TransactionClient) {
  const warehouseId = await inventoryService.getPrimaryWarehouse(tx);
  if (!warehouseId) {
      logger.error('No warehouse configured in database');
      throw new InventoryError("No warehouse configured.");
    }
  return warehouseId;
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
        const defaultVariants = await resolveDefaultVariantsMap(
          tx,
          data.items.map((item) => item.productId),
        );
        const resolvedItems = data.items.map((item) => {
          const resolvedVariantId =
            item.variantId || defaultVariants.get(item.productId)?.id || null;
          return {
            ...item,
            variantId: resolvedVariantId ?? undefined,
          };
        });

        // 2. Reserve Stock (Fail fast)
        if (!data.options?.skipReservation) {
            for (const item of resolvedItems) {
                 if (item.variantId) {
                     await inventoryService.reserveStock(tx, warehouseId, item.variantId, item.quantity);
                 } else {
                   logger.warn(`Order item ${item.name} has no variantId, skipping reservation.`, { productId: item.productId });
                 }
            }
        }

        // 3. Generate sequential order number
        const lastOrder = await tx.order.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { orderNumber: true }
        });
        const nextOrderNumber = generateNextOrderNumber(lastOrder?.orderNumber || null);

        // 4. Create Order
        const order = await tx.order.create({
            data: {
                orderNumber: nextOrderNumber,
                totalPrice: new Prisma.Decimal(data.totalPrice),
                subtotal: data.subtotal ? new Prisma.Decimal(data.subtotal) : undefined,
            status: data.options?.status || (data.paymentMethod === 'cod' ? OrderStatus.Pending : OrderStatus.PaymentPending),
                userId: data.userId, // Link order to user
                paymentMethod: data.paymentMethod || 'cod',
            couponId: (data as unknown as { couponId?: string }).couponId || undefined,
            pointsRedeemed: data.pointsRedeemed || 0,
            firstName: data.firstName,
            lastName: data.lastName,
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail,
            alternativePhone: data.alternativePhone,
            shippingAddress: data.shippingAddress,
            shippingGovernorate: data.shippingGovernorate,
            shippingCity: data.shippingCity,
            shippingNotes: data.shippingNotes,
            discountAmount: data.discountAmount ? new Prisma.Decimal(data.discountAmount) : undefined,
            shippingCost: data.shippingCost ? new Prisma.Decimal(data.shippingCost) : undefined,
            orderSource: data.orderSource || 'online',
                items: {
                    create: resolvedItems.map(item => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        name: item.name,
                        price: new Prisma.Decimal(item.price),
                      quantity: item.quantity,
                      warehouseId: warehouseId // Track where stock was reserved
                    }))
                }
            },
            include: { items: true }
        });

        logger.info(`Order created: ${order.id}`, { totalPrice: data.totalPrice, itemsCount: resolvedItems.length, orderId: order.id });

        // 4. Return mapped order (Ensure types match)
        return mapToOrderType(order);
    }, {
        maxWait: 10000,
        timeout: 30000
    });
}

import { orderStateService } from './orders/orderStateService';

export async function updateOrderStatus(
    orderId: string, 
    newStatus: OrderStatus, 
    actor: ActorRole = 'system', 
  actorId?: string,
  reason?: string
): Promise<Order> {
  await orderStateService.transitionOrder({
    orderId,
    newStatus,
    actor,
    actorId,
    reason,
  });

  const updated = await prisma.order.findUnique({
    where: { id: orderId },
        include: { items: true }
    });

  if (!updated) throw new Error('Order not found after update');
  return mapToOrderType(updated);
}

export type UpdateOrderServiceParams = z.infer<typeof import('@/lib/validators/order').updateOrderDetailsSchema>;

export async function updateOrder(orderId: string, updates: UpdateOrderServiceParams): Promise<Order> {
  const { items, ...details } = updates;

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch current order with items
    const currentOrder = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!currentOrder) throw new Error('Order not found');

    const warehouseId = await getDefaultWarehouseId(tx);

    // 2. Handle Item Updates & Inventory
    // We only process inventory if items are provided in the update
    if (items) {
      // Map current items for easy lookup
      const currentItemsMap = new Map(currentOrder.items.map(i => [i.variantId || 'novar', i]));
      const newItemsMap = new Map(items.map(i => [i.variantId || 'novar', i]));

      // Calculate Inventory Changes
      const isStockCommitted = [OrderStatus.Shipped, OrderStatus.Delivered].includes(currentOrder.status as OrderStatus);

      // A. Released items (reduced quantity or removed)
      for (const currentItem of currentOrder.items) {
        const key = currentItem.variantId || 'novar';
        const newItem = newItemsMap.get(key);
        const newQty = newItem ? newItem.quantity : 0;

        if (newQty < currentItem.quantity) {
          const diff = currentItem.quantity - newQty;
          if (currentItem.variantId) {
            // Use specific warehouse from the item, fall back to default if null
            const targetWarehouseId = currentItem.warehouseId || warehouseId;

            if (isStockCommitted) {
              // If order is shipped, "Releasing" means putting it back in Available stock (Restock)
              // because it was already deducted from Reserved.
              await inventoryService.increaseStock(tx, targetWarehouseId, currentItem.variantId, diff);
            } else {
              // Normal flow: Release reservation
              await inventoryService.releaseStock(tx, targetWarehouseId, currentItem.variantId, diff);
            }
          }
        }
      }

      // B. Reserved items (increased quantity or added)
      for (const newItem of items) {
        const key = newItem.variantId || 'novar';
        const currentItem = currentItemsMap.get(key);
        const currentQty = currentItem ? currentItem.quantity : 0;

        if (newItem.quantity > currentQty) {
          const diff = newItem.quantity - currentQty;
          if (newItem.variantId) {
            // For new items/added qty, we use the transaction's default warehouse (or we could try to use currentItem.warehouseId if it exists? 
            // currentItem might be null if it's a new line item. If it exists, better to pull from same warehouse to keep line items clean.)
            const targetWarehouseId = currentItem?.warehouseId || warehouseId;

            // 1. Reserve
            await inventoryService.reserveStock(tx, targetWarehouseId, newItem.variantId, diff);

            // 2. Commit immediately if order is already shipped
            if (isStockCommitted) {
              await inventoryService.commitStock(tx, targetWarehouseId, newItem.variantId, diff);
            }
          }
        }
      }

      // C. Update DB Items
      // Wipe and recreate items is safest to ensure consistency, 
      // OR upsert. Since we have no unique ID for new items, detailed sync is complex.
      // Strategy: Delete all and create new.
      await tx.orderItem.deleteMany({ where: { orderId } });

      if (items.length > 0) {
        await tx.orderItem.createMany({
          data: items.map(item => ({
            orderId,
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            price: new Prisma.Decimal(item.price),
            quantity: item.quantity,
            // Persist the warehouseId. Try to find it from old items, or default for new ones.
            // This ensures we continue tracking where this item lies.
            warehouseId: currentItemsMap.get(item.variantId || 'novar')?.warehouseId || warehouseId
          }))
        });
      }
    }

    // 3. Recalculate Totals
    // If items changed, we must recalculate total.
    // If items didn't change, we keep existing total (unless explicitly updated?)
    // The calling action should probably calculate the new total.
    // Let's assume the update logic handles the total calculation based on passed items or we calculate it here.

    let newTotalPrice = currentOrder.totalPrice;
    if (items) {
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shipping = details.shippingCost !== undefined ? details.shippingCost : (currentOrder.shippingCost?.toNumber() || 0);
      const discount = details.discountAmount !== undefined ? details.discountAmount : (currentOrder.discountAmount?.toNumber() || 0);
      // Points value previously redeemed? That's tricky. We assume pointsRedeemed isn't changing here for now.
      // If points logic needs update, it's more complex.
      // Assuming simple calculation:
      newTotalPrice = new Prisma.Decimal(Math.max(0, subtotal + shipping - discount));
    } else if (details.shippingCost !== undefined || details.discountAmount !== undefined) {
      // Items didn't change but costs did
      // Better to just rely on what's passed or stored.
      // Actually, currentOrder.subtotal might be null in schema? checked schema: subtotal Decimal?
      // Let's re-sum current items if subtotal is missing.
      const subtotal = currentOrder.subtotal?.toNumber() || currentOrder.items.reduce((sum, item) => sum + (item.price.toNumber() * item.quantity), 0);

      const shipping = details.shippingCost !== undefined ? details.shippingCost : (currentOrder.shippingCost?.toNumber() || 0);
      const discount = details.discountAmount !== undefined ? details.discountAmount : (currentOrder.discountAmount?.toNumber() || 0);

      newTotalPrice = new Prisma.Decimal(Math.max(0, subtotal + shipping - discount));
    }

    // 4. Update Order Details
    const subtotalValue = items 
        ? items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        : currentOrder.subtotal?.toNumber();

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        firstName: details.firstName,
        lastName: details.lastName,
        customerPhone: details.customerPhone,
        customerEmail: details.customerEmail,
        alternativePhone: details.alternativePhone,
        shippingAddress: details.shippingAddress,
        shippingGovernorate: details.shippingGovernorate,
        shippingCity: details.shippingCity,
        shippingNotes: details.shippingNotes,
        shippingCost: details.shippingCost !== undefined ? new Prisma.Decimal(details.shippingCost) : undefined,
        discountAmount: details.discountAmount !== undefined ? new Prisma.Decimal(details.discountAmount) : undefined,
        subtotal: subtotalValue !== undefined ? new Prisma.Decimal(subtotalValue) : undefined,
        totalPrice: newTotalPrice,
        orderSource: details.orderSource,
      },
      include: { items: true }
    });

    logger.info(`Order updated: ${orderId}`, { prevTotal: currentOrder.totalPrice, newTotal: newTotalPrice });
    return mapToOrderType(updatedOrder);
  }, {
    maxWait: 10000,
    timeout: 30000
  });
}


export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  sortBy?: 'newest' | 'oldest';
  search?: string;
  dateRange?: { from: Date; to: Date };
  view?: 'all' | 'issues' | 'returns';
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

export async function getOrders({
  page = 1,
  limit = 10,
  status,
  sortBy = 'newest',
  search,
  dateRange,
  view = 'all'
}: GetOrdersParams): Promise<OrdersResponse> {
  const skip = (Math.max(1, page) - 1) * limit; 
  
  const where: Prisma.OrderWhereInput = {};

  // Standard Status Filter
  if (status) {
    where.status = status;
  } else if (view === 'all') {
    // Show all statuses
  }
  
  // VIEW LOGIC
  if (view === 'issues') {
    where.OR = [
      { riskScore: { isNot: null } },
      { disputes: { some: {} } }
    ];
  } else if (view === 'returns') {
    where.returnRequest = { isNot: null };
  }

  // Search Logic
  if (search) {
     where.OR = [
       ...(where.OR || []),
       { id: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
       { customerName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }, // Use customerName for backward compatibility
       { customerPhone: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
       { user: { email: { contains: search, mode: 'insensitive' as Prisma.QueryMode } } },
       { user: { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } } }
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
        user: { select: { name: true, email: true } },
        riskScore: true,
        disputes: { take: 1 }
      },
    }),
  ]);

  return {
    data: orders.map(order => ({
      ...mapToOrderType(order),
      riskScore: order.riskScore?.score,
      hasDispute: order.disputes.length > 0
    })),
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
  orderNumber: string;
  firstName?: string | null;
  lastName?: string | null;
  alternativePhone?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  shippingAddress?: string | null;
  shippingGovernorate?: string | null;
  shippingCity?: string | null;
  shippingNotes?: string | null;
  items: PrismaOrderItem[];
  user?: Partial<PrismaUser> | null;
};

function mapToOrderType(prismaOrder: PrismaOrderWithRelations): Order {
    return {
        id: prismaOrder.id,
      orderNumber: prismaOrder.orderNumber,
        totalPrice: prismaOrder.totalPrice instanceof Prisma.Decimal ? prismaOrder.totalPrice.toNumber() : Number(prismaOrder.totalPrice),
        status: prismaOrder.status as OrderStatus,
        createdAt: prismaOrder.createdAt instanceof Date ? prismaOrder.createdAt.toISOString() : String(prismaOrder.createdAt),
      paymentMethod: prismaOrder.paymentMethod,
      firstName: prismaOrder.firstName ?? null,
      lastName: prismaOrder.lastName ?? null,
      alternativePhone: prismaOrder.alternativePhone ?? null,
      customerPhone: prismaOrder.customerPhone ?? null,
      customerEmail: prismaOrder.customerEmail ?? null,
      shippingAddress: prismaOrder.shippingAddress ?? null,
      shippingGovernorate: prismaOrder.shippingGovernorate ?? null,
      shippingCity: prismaOrder.shippingCity ?? null,
      shippingNotes: prismaOrder.shippingNotes ?? null,
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

export async function internalCancelOrder(orderId: string, reason?: string) {
  return await updateOrderStatus(orderId, OrderStatus.Cancelled, 'system', undefined, reason);
}
