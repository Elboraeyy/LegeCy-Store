'use server';

import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/guards';
import { recordOrderEvent } from '@/lib/services/orderLifecycleService';
// import { sendOrderConfirmationEmail } from '@/lib/services/emailService'; // Assuming this exists or similar

export async function bulkConfirmOrders(orderIds: string[], adminId: string) {
  await requireAdmin();

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const id of orderIds) {
    try {
      // 1. Check current status
      const order = await prisma.order.findUnique({ where: { id } });
      if (!order) continue;
      
      if (order.status !== 'pending' && order.status !== 'payment_pending') {
        results.failed++;
        results.errors.push(`Order ${id} is not pending (Status: ${order.status})`);
        continue;
      }

      // 2. Update Status
      await prisma.order.update({
        where: { id },
        data: { status: 'confirmed' }
      });

      // 3. Trigger Lifecycle Event
      await recordOrderEvent({
        orderId: id,
        eventType: 'CONFIRMED',
        fromStatus: order.status,
        toStatus: 'confirmed',
        triggeredBy: adminId
      });

      // 4. Send Email (Optional, usually done on creation but confirmed might trigger another)
      // await sendOrderConfirmationEmail(order.email, order);

      results.success++;
    } catch (error) {
      console.error(`Failed to confirm order ${id}:`, error);
      results.failed++;
      results.errors.push(`Error confirming order ${id}`);
    }
  }

  return results;
}
