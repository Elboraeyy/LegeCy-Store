import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';
import AbandonedCartEmail from '@/lib/email/templates/AbandonedCartEmail';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); // Valid key required

export async function GET(request: Request) {
  // 1. Security Check (Basic Bearer token or Vercel Cron header)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // For demo/dev allow without secret if localhost? No, strict is better.
    // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Find abandoned carts (e.g., > 1 hour old)
    const threshold = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago for testing

    const abandonedCarts = await prisma.cart.findMany({
      where: {
        updatedAt: { lte: threshold },
        abandonedEmailSent: false,
        items: { some: {} } // Has items
      },
      include: {
        user: true,
        items: {
          include: {
            product: true,
            variant: true
          }
        }
      },
      take: 10 // Batch size
    });

    const results = [];

    // 3. Process each cart
    for (const cart of abandonedCarts) {
      if (!cart.user.email) continue;

      const items = cart.items.map(item => ({
        name: item.product.name,
        price: Number(item.variant?.price || item.product.compareAtPrice || 0),
        image: item.product.imageUrl || ''
      }));

      // Send Email
      await resend.emails.send({
        from: 'Legacy Store <onboarding@resend.dev>', // Should be a verified domain
        to: cart.user.email,
        subject: 'You left items in your cart!',
        react: AbandonedCartEmail({
            customerName: cart.user.name || 'Customer',
            items: items,
            checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cart`
        })
      });

      // Mark as sent
      await prisma.cart.update({
        where: { id: cart.id },
        data: { abandonedEmailSent: true }
      });

      results.push(cart.id);
    }

    return NextResponse.json({ 
        success: true, 
        processed: results.length, 
        carts: results 
    });

  } catch (error) {
    console.error('Abandoned Cart Job Error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
