import prisma from '@/lib/prisma';
import Link from 'next/link';
import TriggerCronButton from '@/components/admin/TriggerCronButton';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';
import { subDays, format } from 'date-fns';

export default async function AdminDashboard() {
    // parallel data fetching for speed
    const [
        totalOrders,
        totalRevenue,
        pendingOrders,
        lowStockItems,
        last30DaysOrders,
        statusCounts
    ] = await Promise.all([
        prisma.order.count(),
        prisma.order.aggregate({
            _sum: { totalPrice: true },
            where: { status: 'paid' } // Only count paid orders
        }),
        prisma.order.count({ where: { status: 'pending' } }),
        // Count variants where ANY related inventory item has available <= 5
        prisma.inventory.count({
             where: { available: { lte: 5 } }
        }),
        // Fetch last 30 days of data for charts
        prisma.order.findMany({
            where: {
                createdAt: {
                    gte: subDays(new Date(), 30)
                },
                status: 'paid' // Consider visualizing all orders or just paid ones? Typically paid revenue.
            },
            select: {
                createdAt: true,
                totalPrice: true
            },
            orderBy: { createdAt: 'asc' }
        }),
        prisma.order.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        })
    ]);

    // Process Sales Trend Data
    const salesMap = new Map<string, number>();
    // Initialize last 30 days with 0
    for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        salesMap.set(format(date, 'yyyy-MM-dd'), 0);
    }
    
    // Fill with actual data
    last30DaysOrders.forEach(order => {
        const dateKey = format(order.createdAt, 'yyyy-MM-dd');
        if (salesMap.has(dateKey)) {
            salesMap.set(dateKey, (salesMap.get(dateKey) || 0) + Number(order.totalPrice));
        }
    });

    const salesTrend = Array.from(salesMap.entries()).map(([date, value]) => ({
        date,
        value
    }));

    // Process Order Status Data
    const ordersByStatusData = statusCounts.map(item => ({
        status: item.status,
        count: item._count.status
    }));

    const revenue = new Intl.NumberFormat('en-EG', {
        style: 'currency',
        currency: 'EGP', 
        maximumFractionDigits: 0
    }).format(Number(totalRevenue._sum.totalPrice || 0));

    // Get current date for the header
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div>
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Dashboard</h1>
                    <p className="admin-subtitle">Welcome back to the command center.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-on-light)' }}>{today}</div>
                     <div className="status-badge status-active" style={{ marginTop: '6px' }}>System Operational</div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="admin-grid" style={{ marginBottom: '40px' }}>
                <div className="admin-card">
                    <div className="stat-label">Total Revenue</div>
                    <div className="stat-value">{revenue}</div>
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '12px' }}>
                        Lifetime verified sales
                    </div>
                </div>

                <div className="admin-card">
                    <div className="stat-label">Total Orders</div>
                    <div className="stat-value">{totalOrders}</div>
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '12px' }}>
                        Across all statuses
                    </div>
                </div>

                <div className="admin-card" style={{ borderLeft: pendingOrders > 0 ? '4px solid #b76e00' : '' }}>
                    <div className="stat-label">Pending Action</div>
                    <div className="stat-value" style={{ color: pendingOrders > 0 ? '#b76e00' : 'inherit' }}>
                        {pendingOrders}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '12px' }}>
                        Orders awaiting fulfillment
                    </div>
                </div>

                <div className="admin-card" style={{ borderLeft: lowStockItems > 0 ? '4px solid #cc0000' : '' }}>
                    <div className="stat-label">Inventory Alert</div>
                    <div className="stat-value" style={{ color: lowStockItems > 0 ? '#cc0000' : 'inherit' }}>
                        {lowStockItems}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '12px' }}>
                        Items with low stock (≤ 5)
                    </div>
                </div>
            </div>


            {/* Analytics Charts */}
            <AnalyticsCharts 
                salesTrend={salesTrend}
                ordersByStatus={ordersByStatusData}
            />

            {/* Quick Actions & System */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <div className="admin-card">
                    <div className="stat-label" style={{ marginBottom: '24px' }}>Quick Actions</div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <Link href="/admin/products/new" className="admin-btn admin-btn-primary">
                            + New Product
                        </Link>
                        <Link href="/admin/orders" className="admin-btn admin-btn-outline">
                            Manage Orders
                        </Link>
                        <Link href="/admin/config" className="admin-btn admin-btn-outline">
                            Configuration
                        </Link>
                        <TriggerCronButton />
                    </div>
                </div>

                <div className="admin-card">
                    <div className="stat-label" style={{ marginBottom: '24px' }}>System Health</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
                             <span style={{ color: 'var(--admin-text-muted)' }}>Database</span>
                             <span style={{ color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#166534' }}></span>
                                Connected
                             </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
                             <span style={{ color: 'var(--admin-text-muted)' }}>Payments</span>
                             <span style={{ color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#166534' }}></span>
                                Active
                             </span>
                        </div>
                         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
                             <span style={{ color: 'var(--admin-text-muted)' }}>Worker</span>
                             <span style={{ color: '#b76e00', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#b76e00' }}></span>
                                Idle
                             </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
