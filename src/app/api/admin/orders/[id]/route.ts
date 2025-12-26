import { NextResponse } from 'next/server';
import { getOrderForAdmin } from '@/lib/services/orderService';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Auth & Permission Check
    await requireAdminPermission(AdminPermissions.ORDERS.READ);

    // 2. Fetch via Service
    const order = await getOrderForAdmin(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error(`Error fetching order ${request.url}:`, error);
    // Handle specific errors if guards throw them (e.g. Unauthorized)
    // Assuming guards throw Errors that we might want to catch specifically or let bubble?
    // For now, general catch.
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

