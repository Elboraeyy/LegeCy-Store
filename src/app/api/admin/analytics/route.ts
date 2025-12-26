import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { subDays, format } from 'date-fns';

export async function GET() {
  try {
    // Date range: Last 30 days
    const endDate = new Date();
    const startDate = subDays(endDate, 30);

    // 1. Fetch Orders for Revenue Trend
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'cancelled' } // Exclude cancelled
      },
      select: {
        createdAt: true,
        totalPrice: true,
        status: true,
        items: {
          select: {
            name: true,
            quantity: true,
            price: true
          }
        }
      }
    });

    // 2. Aggregate Revenue by Date
    const revenueMap = new Map<string, number>();
    // Initialize last 30 days with 0
    for (let i = 0; i <= 30; i++) {
        const d = subDays(endDate, i);
        revenueMap.set(format(d, 'MMM dd'), 0);
    }

    orders.forEach(order => {
        const dateKey = format(order.createdAt, 'MMM dd');
        const current = revenueMap.get(dateKey) || 0;
        revenueMap.set(dateKey, current + Number(order.totalPrice));
    });

    // Convert to array and reverse to show chronological order
    const revenueData = Array.from(revenueMap.entries())
        .map(([date, amount]) => ({ date, amount }))
        .reverse();

    // 3. Aggregate Order Status
    const statusCounts: Record<string, number> = {};
    orders.forEach(order => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // 4. TOP PRODUCTS (Simple aggregation from fetched orders)
    const productSales: Record<string, number> = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
        });
    });

    const topProducts = Object.entries(productSales)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5); // Top 5

    return NextResponse.json({
        revenue: revenueData,
        status: statusData,
        topProducts
    });

  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
