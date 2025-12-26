import { NextResponse } from 'next/server';
import { getOrders } from '@/lib/services/orderService';
import { OrderStatus } from '@/types/order';

export async function GET(request: Request) {
  try {
    const { requireAdminPermission } = await import('@/lib/auth/guards');
    const { AdminPermissions } = await import('@/lib/auth/permissions');
    
    // Auth Check
    await requireAdminPermission(AdminPermissions.ORDERS.READ);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as OrderStatus | undefined;
    const search = searchParams.get('search') || undefined;
    
    // Date Range
    let dateRange;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from && to) {
      dateRange = { from: new Date(from), to: new Date(to) };
    }

    // Fetch ALL matching orders for export (limit: 1000 for safety, or implement streaming later)
    const { data } = await getOrders({ 
      page: 1, 
      limit: 1000, 
      status, 
      search, 
      dateRange,
      sortBy: 'newest'
    });

    // Generate CSV
    const headers = ['Order ID', 'Date', 'Status', 'Total', 'Items Count'];
    const rows = data.map(order => [
      order.id,
      new Date(order.createdAt).toISOString(),
      order.status,
      order.totalPrice.toFixed(2),
      order.items.length.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
