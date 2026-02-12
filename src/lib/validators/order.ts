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
  shippingCost: z.number().nonnegative().optional(),
  userId: z.string().optional(),
  firstName: z.string().optional(), // New
  lastName: z.string().optional(),  // New
  alternativePhone: z.string().optional().nullable(), // New
  shippingAddress: z.string().optional(), // New
  shippingGovernorate: z.string().optional(), // New
  shippingCity: z.string().optional(), // New
  shippingNotes: z.string().optional().nullable(), // New
  paymentMethod: z.enum(['cod', 'wallet', 'instapay']).optional(),
  options: z.object({
    skipReservation: z.boolean().optional(),
  }).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});
