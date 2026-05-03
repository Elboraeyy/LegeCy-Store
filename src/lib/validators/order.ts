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
  discountAmount: z.number().nonnegative().optional(), // New
  orderSource: z.string().optional(), // New
  userId: z.string().optional(),
  firstName: z.string().optional(), // New
  lastName: z.string().optional(),  // New
  alternativePhone: z.string().optional().nullable(), // New
  customerPhone: z.string().optional().nullable(), // New
  customerEmail: z.string().optional().nullable(), // New
  shippingAddress: z.string().optional().nullable(), // New
  shippingGovernorate: z.string().optional().nullable(), // New
  shippingCity: z.string().optional().nullable(), // New
  shippingNotes: z.string().optional().nullable(), // New
  paymentMethod: z.enum(['cod', 'wallet', 'instapay', 'card']).optional(),
  couponCode: z.string().optional(), // New
  pointsRedeemed: z.number().int().nonnegative().optional(), // New
  options: z.object({
    skipReservation: z.boolean().optional(),
    status: z.nativeEnum(OrderStatus).optional(), // Allow forcing status (e.g. for Drafts)
  }).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const updateOrderDetailsSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  alternativePhone: z.string().optional().nullable(),
  shippingAddress: z.string().optional(),
  shippingGovernorate: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingNotes: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional().nullable(),
    name: z.string(),
    price: z.number().nonnegative(),
    quantity: z.number().int().nonnegative(), // 0 quantity could mean remove, but typically we filter those out
  })).optional(),
  shippingCost: z.number().nonnegative().optional(),
  discountAmount: z.number().nonnegative().optional(),
});
