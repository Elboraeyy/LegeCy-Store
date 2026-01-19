'use server';

/**
 * @deprecated Use @/lib/services/orders/orderStateService instead.
 * This file is kept for backward compatibility and will be removed in Phase 5.
 */

import { orderStateService } from './orders/orderStateService';

// Inline definition to bypass build cache availability issues
export type OrderEventType = 'CREATED' | 'CONFIRMED' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';


export const recordOrderEvent = orderStateService.recordOrderEvent;

// Re-export other functions if they were public and needed,
// strictly for compat.
// But mostly `recordOrderEvent` was the main entry point.
// getOrderEvents was also public.

import prisma from '@/lib/prisma';

export const getOrderEvents = async (orderId: string) => {
  return prisma.orderEvent.findMany({
    where: { orderId },
    orderBy: { createdAt: 'asc' }
  });
};

export const isRevenueRecognized = async (orderId: string) => {
  const recognition = await prisma.revenueRecognition.findUnique({
    where: { orderId }
  });
  return !!recognition;
};

