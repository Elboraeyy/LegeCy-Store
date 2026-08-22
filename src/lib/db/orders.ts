import prisma from '@/lib/prisma';
import { Order } from '@/types/order';
import { generateNextOrderNumberFromList } from '@/lib/utils/orderNumberGenerator';

// We reuse the types from our contract, but we need to ensure the DB shape matches or we map it.
// Our schema matches nicely, but let's be explicit.

export interface CreateOrderParams {
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalPrice: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
}

/**
 * @deprecated DO NOT USE. Strictly use OrderService.createOrder instead.
 * This bypasses critical checks (inventory reservation, payment flow, etc).
 */
export async function createOrderInDb(data: CreateOrderParams): Promise<Order> {
  const existingOrders = await prisma.order.findMany({
    select: { orderNumber: true }
  });
  const orderNumber = generateNextOrderNumberFromList(existingOrders.map(o => o.orderNumber));

  const order = await prisma.order.create({
    data: {
      orderNumber,
      totalPrice: data.totalPrice,
      status: data.status,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      },
    },
    include: {
      items: true,
    },
  });

  // Map to our Order type (Prisma Date -> ISO String, Decimal -> Number)
  return {
    ...order,
    totalPrice: order.totalPrice.toNumber(),
    items: order.items.map(i => ({
        ...i,
        price: i.price.toNumber()
    })),
    status: order.status as OrderStatus,
    createdAt: order.createdAt.toISOString(),
    shippingCost: order.shippingCost ? order.shippingCost.toNumber() : undefined,
    discountAmount: order.discountAmount ? order.discountAmount.toNumber() : undefined,
  };
}

export async function getOrderFromDb(id: string): Promise<Order | null> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!order) return null;

  return {
    ...order,
    totalPrice: order.totalPrice.toNumber(),
    items: order.items.map(i => ({
        ...i,
        price: i.price.toNumber()
    })),
    status: order.status as OrderStatus,
    createdAt: order.createdAt.toISOString(),
    shippingCost: order.shippingCost ? order.shippingCost.toNumber() : undefined,
    discountAmount: order.discountAmount ? order.discountAmount.toNumber() : undefined,
  };
}
