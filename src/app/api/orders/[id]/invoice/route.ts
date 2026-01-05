import { NextResponse } from 'next/server';
import { generateInvoiceHtml } from '@/lib/services/invoiceService';
import { requireAuth } from '@/lib/auth/guards';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/orders/[id]/invoice
 * 
 * Generate and return HTML invoice for an order.
 * Requires authenticated user to be the order owner.
 */
export async function GET(
  request: Request,
  props: RouteParams
) {
  try {
    const params = await props.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Auth check - get the user
    const user = await requireAuth();

    // Verify the user owns this order
    const { default: prisma } = await import('@/lib/prisma');
    const order = await prisma.order.findUnique({
      where: { id },
      select: { userId: true, customerEmail: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Allow if user owns the order or if the email matches
    if (order.userId !== user.id && order.customerEmail !== user.email) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate invoice
    const html = await generateInvoiceHtml(id);
    
    if (!html) {
      return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
    }

    // Return HTML for display or download
    const format = new URL(request.url).searchParams.get('format');
    
    if (format === 'download') {
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="invoice-${id.slice(0, 8).toUpperCase()}.html"`,
        },
      });
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    
    if (error instanceof Error && error.message.includes('redirect')) {
      // Auth redirect
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
