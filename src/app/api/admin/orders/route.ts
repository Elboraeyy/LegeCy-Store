import { NextResponse } from 'next/server';
import { getOrders } from '@/lib/services/orderService';
import { OrderStatus } from '@/types/order';

export async function GET(request: Request) {
  try {
    const { requireAdminPermission } = await import('@/lib/auth/guards');
    const { AdminPermissions } = await import('@/lib/auth/permissions');
    
    await requireAdminPermission(AdminPermissions.ORDERS.READ);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as OrderStatus | undefined;
    const sortBy = searchParams.get('sortBy') as 'newest' | 'oldest' | undefined;
    const search = searchParams.get('search') || undefined;
    
    // Parse Date Range
    let dateRange;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from && to) {
      dateRange = { from: new Date(from), to: new Date(to) };
    }

    const result = await getOrders({ page, limit, status, sortBy, search, dateRange });
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
