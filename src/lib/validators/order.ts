import { z } from 'zod';
import { OrderStatus } from '@/lib/orderStatus';

export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional().nullable(),
    name: z.string(),
    price: z.number().nonnegative(),
    quantity: z.number().int().positive(),
  })).min(1, 'Order must have at least one item'),
  totalPrice: z.number().nonnegative(),
  userId: z.string().optional(), // Link order to user
  paymentMethod: z.enum(['cod', 'paymob']).optional(),
  options: z.object({
    skipReservation: z.boolean().optional(),
  }).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});
