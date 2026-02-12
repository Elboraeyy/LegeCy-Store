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
            status: data.paymentMethod === 'cod' ? OrderStatus.Pending : OrderStatus.PaymentPending,
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

import { orderStateService } from './orders/orderStateService';

export async function updateOrderStatus(
    orderId: string, 
    newStatus: OrderStatus, 
    actor: ActorRole = 'system', 
    actorId?: string 
): Promise<Order> {
  await orderStateService.transitionOrder({
    orderId,
    newStatus,
    actor,
    actorId,
  });

  const updated = await prisma.order.findUnique({
    where: { id: orderId },
        include: { items: true }
    });

  if (!updated) throw new Error('Order not found after update');
  return mapToOrderType(updated);
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
       { customerName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
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
  orderNumber: number;
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
