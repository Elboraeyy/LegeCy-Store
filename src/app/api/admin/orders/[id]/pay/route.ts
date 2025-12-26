import { NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/services/orderService';
import { OrderStatus } from '@/lib/orderStatus';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';
import { NotFoundError, ValidationError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: Request,
  props: RouteParams
) {
  try {
    const params = await props.params;
    const { id } = params;

    if (!id) {
       return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Auth & Permission
    const admin = await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);

    // 2. Update Status with Audit Context
    const updatedOrder = await updateOrderStatus(id, OrderStatus.Paid, 'admin', admin.id);
    
    return NextResponse.json(updatedOrder, { status: 200 });

  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ValidationError) {
       return NextResponse.json({ error: error.message }, { status: 400 });
    }
    // Check if error is simple Error for generic msgs
    
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

