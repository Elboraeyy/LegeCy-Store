import prisma from '@/lib/prisma';
import { sendBackInStockEmail } from '@/lib/services/emailService';
import { logger } from '@/lib/logger';

export const stockNotificationService = {
  /**
   * Subscribe a user to alerts for a specific variant
   */
  async subscribe(email: string, variantId: string) {
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
      select: { productId: true }
    });

    if (!variant) throw new Error("Variant not found");

    // Idempotent subscription
    await prisma.stockNotification.upsert({
      where: {
        email_variantId: {
          email,
          variantId
        }
      },
      update: { status: 'pending' }, // Reset to pending if re-subscribing
      create: {
        email,
        variantId,
        productId: variant.productId,
        status: 'pending'
      }
    });

    logger.info(`Subscribed ${email} to variant ${variantId}`);
  },

  /**
   * Check for subscribers and send alerts
   * Called when stock is added
   */
  async notifySubscribers(variantId: string) {
    // 1. Get pending subscriptions
    const subs = await prisma.stockNotification.findMany({
      where: {
        variantId,
        status: 'pending'
      },
      include: {
        product: true,
        variant: true
      }
    });

    if (subs.length === 0) return;

    logger.info(`Found ${subs.length} subscribers for variant ${variantId}`);

    // 2. Send Emails (Batching would be ideal, but looping for now)
    for (const sub of subs) {
      try {
        if (!sub.product) continue;
        const productName = sub.product.name;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://legecy.store';

        await sendBackInStockEmail({
          customerEmail: sub.email,
          productName: productName,
          productUrl: `${appUrl}/products/${sub.product.id}`
        });

        // Mark as sent
        await prisma.stockNotification.update({
          where: { id: sub.id },
          data: { status: 'sent' }
        });

      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        logger.error(`Failed to notify ${sub.email}`, { error: err.message });
      }
    }
  }
};
