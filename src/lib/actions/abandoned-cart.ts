'use server';

import prisma from '@/lib/prisma';
import { sendAbandonedCartEmail } from '../services/emailService';
import { revalidatePath } from 'next/cache';

export interface AbandonedCart {
  id: string;
  userId: string;
  user: {
    name: string | null;
    email: string;
  };
  totalValue: number;
  itemCount: number;
  updatedAt: Date;
  abandonedEmailSent: boolean;
  items: {
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }[];
}

/**
 * Get all abandoned carts
 * Definition: Carts updated > 1 hour ago, with items, and haven't ordered yet.
 * (Note: Simple v1 uses Cart model. If user ordered, Cart usually clears, so existence implies no order)
 */
export async function getAbandonedCarts(): Promise<AbandonedCart[]> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const carts = await prisma.cart.findMany({
    where: {
      updatedAt: {
        lt: oneHourAgo,
      },
      items: {
        some: {}, // Must have items
      },
      abandonedEmailSent: false, // Not yet sent
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              imageUrl: true,
            },
          },
          variant: {
            select: {
              price: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return carts.map(cart => {
    // Calculate total
    const totalValue = cart.items.reduce((sum, item) => {
      const price = item.variant?.price ? Number(item.variant.price) : 0;
      return sum + price * item.quantity;
    }, 0);

    return {
      id: cart.id,
      userId: cart.userId,
      user: {
        name: cart.user.name,
        email: cart.user.email,
      },
      totalValue,
      itemCount: cart.items.length,
      updatedAt: cart.updatedAt,
      abandonedEmailSent: cart.abandonedEmailSent,
      items: cart.items.map(item => ({
        name: item.product.name,
        price: item.variant?.price ? Number(item.variant.price) : 0,
        quantity: item.quantity,
        image: item.product.imageUrl || undefined,
      })),
    };
  });
}

/**
 * Trigger recovery email for a specific cart
 */
export async function sendRecoveryEmailAction(cartId: string) {
  try {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart || !cart.user.email) {
      return { success: false, error: 'Cart or user email not found' };
    }

    // Calculate total
    const totalValue = cart.items.reduce((sum, item) => {
      const price = item.variant?.price ? Number(item.variant.price) : 0;
      return sum + price * item.quantity;
    }, 0);

    // Format for email service
    const emailData = {
      customerName: cart.user.name || 'Valued Customer',
      customerEmail: cart.user.email,
      cartUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      totalValue,
      items: cart.items.map(item => ({
        name: item.product.name,
        price: item.variant?.price ? Number(item.variant.price) : 0,
        image: item.product.imageUrl || undefined,
      })),
    };

    // Send Email
    const result = await sendAbandonedCartEmail(emailData);

    if (result.success) {
      // Mark as sent
      await prisma.cart.update({
        where: { id: cartId },
        data: { abandonedEmailSent: true },
      });
      
      revalidatePath('/admin/marketing/abandoned-carts');
      return { success: true };
    } else {
      return { success: false, error: 'Failed to send email' };
    }

  } catch (error) {
    console.error('Error sending recovery email:', error);
    return { success: false, error: 'Internal server error' };
  }
}
