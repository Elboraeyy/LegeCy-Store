import Link from 'next/link';
import { getAnalyticsSummary, DateRange } from '@/lib/actions/analytics';
import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import '@/app/admin/admin.css';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';

export default async function AnalyticsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    const resolvedParams = await searchParams;
    const range = (resolvedParams.range as DateRange) || '30d';
    const data = await getAnalyticsSummary(range);

    const rangeLabels = { '7d': 'Last 7 Days', '30d': 'Last 30 Days', '90d': 'Last 90 Days' };

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Analytics Dashboard</h1>
                    <p className="admin-subtitle">Performance overview and insights</p>
                </div>
                <div className="date-range-picker">
                    {(['7d', '30d', '90d'] as DateRange[]).map((r) => (
                        <Link
                            key={r}
                            href={`/admin/analytics?range=${r}`}
                            className={`date-range-btn ${range === r ? 'active' : ''}`}
                        >
                            {rangeLabels[r]}
                        </Link>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="admin-grid" style={{ marginBottom: '32px' }}>
                <KPICard 
                    label="Total Revenue" 
                    value={new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(data.totalRevenue)}
                    trend={data.revenueTrend}
                />
                <KPICard 
                    label="Total Orders" 
                    value={data.totalOrders.toString()}
                    trend={data.ordersTrend}
                />
                <KPICard 
                    label="Avg. Order Value" 
                    value={new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(data.averageOrderValue)}
                    trend={data.aovTrend}
                />
                <KPICard 
                    label="Active Customers" 
                    value={data.totalCustomers.toString()} 
                    trend={data.customersTrend}
                />
            </div>

            {/* Charts Section */}
            <div className="admin-grid" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>
                
                {/* Revenue Trend Chart */}
                <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '24px' }}>Revenue Trend ({rangeLabels[range]})</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <AnalyticsCharts salesTrend={data.salesTrend} ordersByStatus={data.ordersByStatus} />
                    </div>
                </div>

                {/* Sidebar Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Low Stock Alert */}
                    {data.lowStockCount > 0 && (
                        <div className="admin-card" style={{ borderLeft: '4px solid #b91c1c' }}>
                            <h3 className="stat-label" style={{ color: '#b91c1c' }}>Inventory Alert</h3>
                            <div style={{ fontSize: '28px', fontWeight: 700, margin: '8px 0', fontFamily: 'Playfair Display, serif' }}>
                                {data.lowStockCount} Items
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                                Running low on stock.
                            </div>
                            <Link href="/admin/products?stock=low_stock" style={{ display: 'inline-block', marginTop: '12px', fontSize: '13px', color: 'var(--admin-accent)', textDecoration: 'underline' }}>
                                Check Inventory →
                            </Link>
                        </div>
                    )}

                    {/* Top Products List */}
                    <div className="admin-card">
                        <h3 className="stat-label" style={{ marginBottom: '16px' }}>Top Selling Products</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {data.topProducts.map((p, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ 
                                            width: '28px', 
                                            height: '28px', 
                                            borderRadius: '50%', 
                                            background: i === 0 ? 'var(--admin-accent)' : '#eee', 
                                            color: i === 0 ? '#1a3c34' : '#555', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            fontSize: '12px', 
                                            fontWeight: 700 
                                        }}>
                                            {i + 1}
                                        </div>
                                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{p.name}</div>
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-muted)' }}>{p.sold} sold</div>
                                </div>
                            ))}
                            {data.topProducts.length === 0 && (
                                <div style={{ fontSize: '13px', color: '#999', fontStyle: 'italic' }}>No sales yet.</div>
                            )}
                        </div>
                    </div>

                    {/* Orders by Status */}
                    <div className="admin-card">
                        <h3 className="stat-label" style={{ marginBottom: '16px' }}>Orders by Status</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {data.ordersByStatus.map((s) => (
                                <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className={`status-badge status-${s.status.toLowerCase()}`}>{s.status}</span>
                                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{s.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>

            {/* Recent Orders */}
            <div className="admin-card" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 className="stat-label" style={{ margin: 0 }}>Recent Orders</h3>
                    <Link href="/admin/orders" className="admin-btn admin-btn-outline" style={{ padding: '6px 12px', fontSize: '11px' }}>
                        View All
                    </Link>
                </div>
                <div className="admin-table-container" style={{ border: 'none', boxShadow: 'none' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recentOrders.map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <Link href={`/admin/orders/${order.id}`} style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--admin-text-on-light)' }}>
                                            #{order.id.slice(0, 8)}
                                        </Link>
                                    </td>
                                    <td>{order.customer}</td>
                                    <td style={{ fontWeight: 600 }}>
                                        {new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(order.total)}
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span>
                                    </td>
                                    <td style={{ color: 'var(--admin-text-muted)', fontSize: '13px' }}>
                                        {new Date(order.date).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {data.recentOrders.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                                        No recent orders
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function KPICard({ label, value, trend }: { label: string, value: string, trend: number }) {
    const trendUp = trend >= 0;
    return (
        <div className="admin-card">
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
            <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px' }}>
                <span style={{ 
                    color: trendUp ? '#166534' : '#b91c1c', 
                    background: trendUp ? '#dcfce7' : '#fee2e2',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600
                }}>
                    {trendUp ? '+' : ''}{trend}%
                </span>
                <span style={{ color: '#999' }}>vs previous period</span>
            </div>
        </div>
    );
}
