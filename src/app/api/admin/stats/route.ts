import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OrderStatus } from '@/types/order';

export async function GET() {
  try {
    const { requireAdminPermission } = await import('@/lib/auth/guards');
    const { AdminPermissions } = await import('@/lib/auth/permissions');
    
    // Auth Check
    await requireAdminPermission(AdminPermissions.ORDERS.READ);

    // 1. Total Orders & Revenue
    const totalOrders = await prisma.order.count();
    const revenueAgg = await prisma.order.aggregate({
      _sum: { totalPrice: true },
    });
    const totalRevenue = revenueAgg._sum.totalPrice?.toNumber() || 0;

    // 2. Orders by Status (Pie Chart)
    // Prisma groupBy is perfect here
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    
    // Normalize to ensure all statuses are present
    const statusDistribution = Object.values(OrderStatus).map(status => ({
      status,
      count: statusCounts.find(c => c.status === status)?._count._all || 0,
    }));

    // 3. Orders Over Time (Last 30 Days) - Line Chart
    // Fetching last 30 days and aggregating in memory for SQLite compatibility and simplicity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        totalPrice: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const timelineMap = new Map<string, { date: string; orders: number; revenue: number }>();
    
    recentOrders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      const existing = timelineMap.get(date) || { date, orders: 0, revenue: 0 };
      existing.orders += 1;
      existing.revenue += order.totalPrice.toNumber();
      timelineMap.set(date, existing);
    });

    // Fill in missing days? Optional, but better for charts. 
    // For now, return what we have.
    const timeline = Array.from(timelineMap.values());

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      statusDistribution,
      timeline,
      pendingOrders: statusCounts.find(s => s.status === OrderStatus.Pending)?._count._all || 0
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
