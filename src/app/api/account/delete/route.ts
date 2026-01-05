import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import prisma from '@/lib/prisma';
import { destroyCustomerSession } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

/**
 * POST /api/account/delete
 * 
 * GDPR Data Deletion Request
 * Deletes all user data and closes the account.
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    
    const body = await request.json().catch(() => ({}));
    const { confirmEmail, reason } = body;

    // Require email confirmation
    if (confirmEmail !== user.email) {
      return NextResponse.json(
        { error: 'Please confirm your email address to proceed' },
        { status: 400 }
      );
    }

    logger.info('GDPR deletion request initiated', { userId: user.id, reason });

    // Start deletion transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete cart items
      await tx.cartItem.deleteMany({
        where: { cart: { userId: user.id } }
      });

      // 2. Delete cart
      await tx.cart.deleteMany({
        where: { userId: user.id }
      });

      // 3. Delete addresses
      await tx.address.deleteMany({
        where: { userId: user.id }
      });

      // 4. Delete sessions
      await tx.session.deleteMany({
        where: { userId: user.id }
      });

      // 5. Anonymize order data (keep for financial records but remove PII)
      await tx.order.updateMany({
        where: { userId: user.id },
        data: {
          userId: null,
          customerName: 'DELETED',
          customerEmail: `deleted-${user.id}@deleted.local`,
          customerPhone: 'DELETED',
          shippingAddress: 'DELETED',
          shippingNotes: null,
        }
      });

      // 6. Delete stock notifications
      await tx.stockNotification.deleteMany({
        where: { email: user.email }
      });

      // 7. Anonymize coupon usage records
      await tx.couponUsage.updateMany({
        where: { userId: user.id },
        data: {
          userId: null
        }
      });

      // 8. Delete the user
      await tx.user.delete({
        where: { id: user.id }
      });
    });

    // Destroy session
    await destroyCustomerSession();

    logger.info('GDPR deletion completed', { userId: user.id });

    return NextResponse.json({
      success: true,
      message: 'Your account and personal data have been deleted successfully.',
    });

  } catch (error) {
    logger.error('GDPR deletion failed', { error });
    
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.json(
      { error: 'Failed to delete account. Please contact support.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/account/delete
 * 
 * Get account deletion status / info
 */
export async function GET() {
  try {
    const user = await requireAuth();
    
    // Get data summary
    const [orderCount, addressCount] = await Promise.all([
      prisma.order.count({ where: { userId: user.id } }),
      prisma.address.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      email: user.email,
      dataItems: {
        orders: orderCount,
        addresses: addressCount,
      },
      warning: 'Deleting your account will permanently remove your personal data. Order history will be anonymized for financial records.',
    });

  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
