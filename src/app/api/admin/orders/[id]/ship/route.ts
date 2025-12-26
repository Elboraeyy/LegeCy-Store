import { NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/services/orderService';
import { OrderStatus } from '@/lib/orderStatus';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';
import { NotFoundError, ValidationError, OrderError } from '@/lib/errors';

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
    
    // 1. Auth check
    const admin = await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);

    // 2. Logic
    const updatedOrder = await updateOrderStatus(id, OrderStatus.Shipped, 'admin', admin.id);
    return NextResponse.json(updatedOrder, { status: 200 });

  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    // Note: InvalidTransition currently throws OrderError -> ValidationError equivalent or just 400
    // If updateOrderStatus throws generic Error or specific OrderError, we should catch it.
    // For now, let's catch standard errors from lib/errors.
    if (error instanceof ValidationError) {
       return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    if (error instanceof OrderError) {
         return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    console.error('Error updating order:', error);
    return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Internal Server Error' 
    }, { status: 500 });
  }
}

