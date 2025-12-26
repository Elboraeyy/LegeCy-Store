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

    // 1. Auth
    const admin = await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);

    // 2. Logic
    const updatedOrder = await updateOrderStatus(id, OrderStatus.Delivered, 'admin', admin.id);
    return NextResponse.json(updatedOrder, { status: 200 });

  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ValidationError) {
       return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    console.error('Error updating order:', error);
    return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Internal Server Error' 
    }, { status: 500 });
  }
}

