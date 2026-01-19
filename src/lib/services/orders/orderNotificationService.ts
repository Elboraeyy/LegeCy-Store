import { sendOrderShippedEmail, sendOrderDeliveredEmail } from '@/lib/services/emailService';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';

export const orderNotificationService = {
  async notifyShipped(orderId: string, metadata?: Record<string, unknown>) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order?.customerEmail) return;

    await sendOrderShippedEmail({
      orderId,
      customerName: order.customerName || 'Customer',
      customerEmail: order.customerEmail,
      trackingNumber: (metadata?.trackingNumber as string) || undefined,
      courierName: (metadata?.courierName as string) || undefined,
      estimatedDelivery: (metadata?.estimatedDelivery as string) || undefined
    });
    
    logger.info(`[Notification] Order ${orderId} SHIPPED email sent.`);
  },

  async notifyDelivered(orderId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order?.customerEmail) return;

    await sendOrderDeliveredEmail({
      orderId,
      customerName: order.customerName || 'Customer',
      customerEmail: order.customerEmail
    });

    logger.info(`[Notification] Order ${orderId} DELIVERED email sent.`);
  }
};
