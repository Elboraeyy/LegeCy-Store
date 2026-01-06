import { NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/services/orderService';
import { OrderStatus } from '@/lib/orderStatus';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { isFeatureEnabled } from '@/lib/killSwitches';
import { recordOrderRevenue } from '@/lib/actions/finance';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/orders/[id]/pay
 * 
 * Manually mark an order as paid.
 * ⚠️ DANGEROUS: This bypasses payment gateway verification.
 * 
 * Disabled by default via kill switch.
 * Requires detailed reason for audit trail.
 */
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

    // 1. Kill Switch Check - DISABLED by default for security
    const manualPayEnabled = await isFeatureEnabled('admin_manual_pay');
    if (!manualPayEnabled) {
      return NextResponse.json(
        { 
          error: 'Manual payment marking is disabled for security. Enable via admin settings if absolutely required.',
          code: 'FEATURE_DISABLED'
        }, 
        { status: 403 }
      );
    }

    // 2. Require reason in request body for audit
    let reason: string = 'Manual admin payment';
    try {
      const body = await request.json();
      if (!body.reason || typeof body.reason !== 'string' || body.reason.length < 10) {
        return NextResponse.json(
          { error: 'A detailed reason (minimum 10 characters) is required for manual payment marking' },
          { status: 400 }
        );
      }
      reason = body.reason;
    } catch {
      return NextResponse.json(
        { error: 'Request body with reason is required' },
        { status: 400 }
      );
    }

    // 3. Auth & Permission
    const admin = await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);



    // 4. Update Status with Audit Context
    const updatedOrder = await updateOrderStatus(id, OrderStatus.Paid, 'admin', admin.id);
    
    // 5. Finance: Record Revenue in Ledger
    // Fire and forget (don't block response, but log error if fails)
    recordOrderRevenue(id, Number(updatedOrder.totalPrice)).catch(e => console.error('Failed to record revenue:', e));

    console.warn(`[SECURITY] Admin ${admin.id} manually marked order ${id} as paid. Reason: ${reason}`);
    
    return NextResponse.json(updatedOrder, { status: 200 });

  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ValidationError) {
       return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


