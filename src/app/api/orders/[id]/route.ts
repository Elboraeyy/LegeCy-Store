import { NextResponse } from 'next/server';
import { getOrderFromDb } from '@/lib/db/orders';
import { validateCustomerSession, validateAdminSession } from '@/lib/auth/session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: Request,
  props: RouteParams
) {
  try {
    const params = await props.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Auth check
    const { user: customer } = await validateCustomerSession().catch(() => ({ user: null }));
    const { user: admin } = await validateAdminSession().catch(() => ({ user: null }));

    if (!customer && !admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    const order = await getOrderFromDb(id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Admin can view any order
    if (admin) {
      return NextResponse.json(order, { status: 200 });
    }

    // Customer can only view their own order
    if (customer && (order.userId === customer.id || order.customerEmail === customer.email)) {
      return NextResponse.json(order, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error retrieving order:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}