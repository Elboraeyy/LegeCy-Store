import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { getAnalyticsSummary, DateRange } from '@/lib/actions/analytics';
import { getAnalyticsTargets } from '@/lib/actions/targets';
import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import '@/app/admin/admin.css';
import {
    RevenueOrdersChart,
    CategoryRevenueChart,
    PaymentMethodChart,
    OrdersByCityChart,
    HourlySalesChart,
    CustomerGrowthChart,
    OrderStatusChart,
    TopProductsChart,
    OrderFunnelChart,
    MonthlyComparisonChart,
    WeeklyComparisonChart,
    DayOfWeekChart,
    ComparisonCard,
    StatsGrid,
    GaugeChart,
    CircularProgress,
    TargetProgressBar,
    MultiRingChart,
    HorizontalProgressGroup,
    BulletChart
} from '@/components/admin/AnalyticsCharts';
import DateRangePicker from '@/components/admin/DateRangePicker';

export default async function AnalyticsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    const resolvedParams = await searchParams;
    const range = (resolvedParams.range as DateRange) || '30d';
    const customStart = resolvedParams.start as string | undefined;
    const customEnd = resolvedParams.end as string | undefined;
    
    const data = await getAnalyticsSummary(range, customStart, customEnd);

    // Get display label for current range
    const getRangeLabel = () => {
        if (range === 'custom' && customStart && customEnd) {
            const start = new Date(customStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const end = new Date(customEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `${start} - ${end}`;
        }
        const labels: Record<string, string> = { 
            '7d': 'Last 7 Days', 
            '30d': 'Last 30 Days', 
            '90d': 'Last 90 Days',
            'all': 'All Time',
            'custom': 'Custom Range'
        };
        return labels[range] || 'Last 30 Days';
    };
    const rangeLabel = getRangeLabel();

    // Fetch real targets from database
    const targets = await getAnalyticsTargets();
    const revenueTarget = targets.revenueTarget;
    const ordersTarget = targets.ordersTarget;
    const customersTarget = targets.customersTarget;

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Analytics Dashboard</h1>
                    <p className="admin-subtitle">Store performance overview and insights</p>
                </div>
                <DateRangePicker currentRange={range} customStart={customStart} customEnd={customEnd} />
            </div>

            {/* Alerts Row */}
            {(data.lowStockCount > 0 || data.pendingReturns > 0) && (
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    {data.lowStockCount > 0 && (
                        <AlertCard 
                            type="warning"
                            title="Inventory Alert"
                            value={`${data.lowStockCount} items`}
                            description="Running low on stock"
                            link="/admin/products?stock=low_stock"
                            linkText="View Products"
                        />
                    )}
                    {data.pendingReturns > 0 && (
                        <AlertCard 
                            type="info"
                            title="Return Requests"
                            value={`${data.pendingReturns} requests`}
                            description="Pending review"
                            link="/admin/orders?status=return"
                            linkText="Review Requests"
                        />
                    )}
                </div>
            )}

            {/* Primary KPI Cards Row */}
            <div className="analytics-kpi-grid" style={{ marginBottom: '24px' }}>
                <KPICard 
                    label="Total Revenue" 
                    value={formatCurrency(data.totalRevenue)}
                    trend={data.revenueTrend}
                    icon="💰"
                />
                <KPICard 
                    label="Total Orders" 
                    value={data.totalOrders.toString()}
                    trend={data.ordersTrend}
                    icon="📦"
                />
                <KPICard 
                    label="Avg. Order Value" 
                    value={formatCurrency(data.averageOrderValue)}
                    trend={data.aovTrend}
                    icon="📊"
                />
                <KPICard 
                    label="Total Customers" 
                    value={data.totalCustomers.toString()} 
                    trend={data.customersTrend}
                    icon="👥"
                />
            </div>

            {/* Target Progress Section */}
            <div className="analytics-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Monthly Targets</span>
                <Link href="/admin/analytics/targets" className="admin-btn admin-btn-outline" style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ✏️ Edit Targets
                </Link>
            </div>
            <div className="admin-card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
                    <BulletChart 
                        value={data.totalRevenue} 
                        target={revenueTarget} 
                        max={revenueTarget * 1.2}
                        label="Revenue Target"
                    />
                    <BulletChart 
                        value={data.totalOrders} 
                        target={ordersTarget} 
                        max={ordersTarget * 1.2}
                        label="Orders Target"
                        color="#4a8b7f"
                    />
                    <BulletChart 
                        value={data.totalCustomers} 
                        target={customersTarget} 
                        max={customersTarget * 1.2}
                        label="Customers Target"
                        color="#d4af37"
                    />
                </div>
            </div>

            {/* Rate Gauges Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <div className="admin-card" style={{ textAlign: 'center' }}>
                    <GaugeChart value={data.fulfillmentRate} label="Fulfillment Rate" color="#166534" />
                </div>
                <div className="admin-card" style={{ textAlign: 'center' }}>
                    <GaugeChart value={100 - data.cancelRate} label="Success Rate" color="#1a3c34" />
                </div>
                <div className="admin-card" style={{ textAlign: 'center' }}>
                    <GaugeChart value={data.repeatCustomerRate} label="Repeat Customers" color="#d4af37" />
                </div>
                <div className="admin-card" style={{ textAlign: 'center' }}>
                    <GaugeChart value={data.couponUsageRate} label="Coupon Usage" color="#2563eb" />
                </div>
            </div>

            {/* Secondary KPI Cards Row - Extended */}
            <div className="analytics-kpi-grid secondary" style={{ marginBottom: '16px' }}>
                <MiniKPICard 
                    label="Revenue Growth" 
                    value={`${data.revenueGrowth > 0 ? '+' : ''}${data.revenueGrowth}%`}
                    icon="📈"
                    color={data.revenueGrowth >= 0 ? 'green' : 'red'}
                />
                <MiniKPICard 
                    label="Fulfillment Rate" 
                    value={`${data.fulfillmentRate}%`}
                    icon="✅"
                    color={data.fulfillmentRate > 80 ? 'green' : 'gold'}
                />
                <MiniKPICard 
                    label="Cancel Rate" 
                    value={`${data.cancelRate}%`}
                    icon="❌"
                    color={data.cancelRate < 5 ? 'green' : 'red'}
                />
                <MiniKPICard 
                    label="Return Rate" 
                    value={`${data.returnRate}%`}
                    icon="↩️"
                    color={data.returnRate < 5 ? 'green' : 'red'}
                />
            </div>

            <div className="analytics-kpi-grid secondary" style={{ marginBottom: '32px' }}>
                <MiniKPICard 
                    label="Coupon Usage" 
                    value={`${data.couponUsageRate}%`}
                    icon="🎫"
                    color="blue"
                />
                <MiniKPICard 
                    label="Items/Order" 
                    value={data.avgItemsPerOrder.toFixed(1)}
                    icon="🛒"
                    color="purple"
                />
                <MiniKPICard 
                    label="Revenue/Customer" 
                    value={formatCurrency(data.revenuePerCustomer)}
                    icon="💎"
                    color="gold"
                />
                <MiniKPICard 
                    label="Orders/Customer" 
                    value={data.avgOrdersPerCustomer.toFixed(1)}
                    icon="🔄"
                    color="blue"
                />
            </div>

            {/* Period Comparison Section */}
            <div className="analytics-section-title">Period Comparison</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <ComparisonCard 
                    current={data.periodComparison.currentPeriod.revenue}
                    previous={data.periodComparison.previousPeriod.revenue}
                    label="Revenue"
                    format="currency"
                />
                <ComparisonCard 
                    current={data.periodComparison.currentPeriod.orders}
                    previous={data.periodComparison.previousPeriod.orders}
                    label="Orders"
                    format="number"
                />
                <ComparisonCard 
                    current={data.periodComparison.currentPeriod.customers}
                    previous={data.periodComparison.previousPeriod.customers}
                    label="New Customers"
                    format="number"
                />
            </div>

            {/* Circular Progress Rates */}
            <div className="admin-card" style={{ marginBottom: '24px' }}>
                <h3 className="stat-label" style={{ marginBottom: '24px' }}>Performance Rates</h3>
                <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
                    <CircularProgress value={data.fulfillmentRate} label="Fulfillment" color="#166534" />
                    <CircularProgress value={100 - data.cancelRate} label="Success" color="#1a3c34" />
                    <CircularProgress value={data.repeatCustomerRate} label="Repeat" color="#d4af37" />
                    <CircularProgress value={100 - data.returnRate} label="Retention" color="#2563eb" />
                </div>
            </div>

            {/* Main Charts Section */}
            <div className="analytics-section-title">Revenue Analytics</div>
            
            {/* Revenue & Orders Chart - Full Width */}
            <div className="admin-card" style={{ marginBottom: '24px' }}>
                <div className="chart-header">
                    <h3 className="stat-label">Revenue & Orders Trend</h3>
                    <span className="chart-period">{rangeLabel}</span>
                </div>
                <div style={{ height: '320px', width: '100%' }}>
                    <RevenueOrdersChart data={data.salesTrend} />
                </div>
            </div>

            {/* Monthly & Weekly Comparison */}
            <div className="analytics-charts-grid" style={{ marginBottom: '32px' }}>
                <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '16px' }}>Monthly Revenue (Last 6 Months)</h3>
                    <MonthlyComparisonChart data={data.monthlyRevenue} />
                </div>
                <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '16px' }}>Weekly Revenue Comparison</h3>
                    <WeeklyComparisonChart data={data.weeklyRevenue} />
                </div>
            </div>

            {/* Order Analytics Section */}
            <div className="analytics-section-title">Order Analytics</div>
            
            <div className="analytics-charts-grid">
                {/* Order Funnel */}
                <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '16px' }}>Order Funnel</h3>
                    <OrderFunnelChart data={data.orderFunnel} />
                </div>

                {/* Order Status Distribution */}
                <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '16px' }}>Order Status</h3>
                    <OrderStatusChart data={data.ordersByStatus} />
                </div>

                {/* Orders by Day of Week */}
                <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '16px' }}>Orders by Day</h3>
                    <DayOfWeekChart data={data.ordersByDayOfWeek} />
                </div>

                {/* Orders by City */}
                <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '16px' }}>Orders by City</h3>
                    <OrdersByCityChart data={data.ordersByCity} />
                </div>
            </div>

            {/* Hourly Sales Pattern */}
            <div className="admin-card" style={{ marginTop: '24px' }}>
                <h3 className="stat-label" style={{ marginBottom: '20px' }}>Hourly Sales Pattern (24h)</h3>
                <HourlySalesChart data={data.ordersByHour} />
            </div>

            {/* Revenue Breakdown Section */}
            <div className="analytics-section-title" style={{ marginTop: '32px' }}>Revenue Breakdown</div>

            <div className="analytics-charts-grid">
                {/* Revenue by Category */}
                <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '16px' }}>Revenue by Category</h3>
                    <CategoryRevenueChart data={data.revenueByCategory} />
                </div>

                {/* Payment Methods */}
                <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '16px' }}>Payment Methods</h3>
                    <PaymentMethodChart data={data.revenueByPaymentMethod} />
                </div>
            </div>

            {/* Multi-Ring Progress Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '16px' }}>Category Performance</h3>
                    <MultiRingChart data={data.revenueByCategory.slice(0, 5).map((cat, i) => ({
                        label: cat.category,
                        value: cat.revenue,
                        max: data.revenueByCategory[0]?.revenue || 1,
                        color: ['#1a3c34', '#d4af37', '#2563eb', '#7c3aed', '#ea580c'][i]
                    }))} />
                </div>
                <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '16px' }}>City Distribution</h3>
                    <HorizontalProgressGroup items={data.ordersByCity.slice(0, 6).map(city => ({
                        label: city.city,
                        value: city.count
                    }))} />
                </div>
            </div>

            {/* Customer Analytics Section */}
            <div className="analytics-section-title" style={{ marginTop: '32px' }}>Customer Analytics</div>

            <div className="analytics-charts-grid">
                {/* Customer Growth */}
                <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '16px' }}>Customer Growth</h3>
                    <CustomerGrowthChart data={data.customerGrowth} />
                </div>

                {/* Top Products */}
                <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '16px' }}>Top Selling Products</h3>
                    <TopProductsChart data={data.topProducts} />
                </div>
            </div>

            {/* Target Progress Bars */}
            <div className="admin-card" style={{ marginTop: '24px' }}>
                <h3 className="stat-label" style={{ marginBottom: '20px' }}>Progress Towards Targets</h3>
                <TargetProgressBar 
                    current={data.totalRevenue} 
                    target={revenueTarget} 
                    label="Revenue Target"
                    format="currency"
                />
                <TargetProgressBar 
                    current={data.totalOrders} 
                    target={ordersTarget} 
                    label="Orders Target"
                    format="number"
                />
                <TargetProgressBar 
                    current={data.totalCustomers} 
                    target={customersTarget} 
                    label="Customers Target"
                    format="number"
                />
            </div>

            {/* Bottom Section - Lists */}
            <div className="analytics-section-title" style={{ marginTop: '32px' }}>Performance Details</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                
                {/* Top Products List */}
                <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 className="stat-label" style={{ margin: 0 }}>Top 10 Products</h3>
                        <Link href="/admin/analytics/top-products" className="admin-btn admin-btn-outline" style={{ padding: '6px 12px', fontSize: '11px' }}>
                            View All
                        </Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {data.topProducts.slice(0, 10).map((p, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ 
                                        width: '28px', 
                                        height: '28px', 
                                        borderRadius: '50%', 
                                        background: i < 3 ? 'var(--admin-accent)' : '#eee', 
                                        color: i < 3 ? '#1a3c34' : '#555', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        fontSize: '12px', 
                                        fontWeight: 700 
                                    }}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{p.name.slice(0, 25)}{p.name.length > 25 ? '...' : ''}</div>
                                        <div style={{ fontSize: '11px', color: '#999' }}>{formatCurrency(p.revenue)}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-muted)' }}>{p.sold} sold</div>
                            </div>
                        ))}
                        {data.topProducts.length === 0 && (
                            <div style={{ fontSize: '13px', color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
                                No sales yet
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Customers */}
                <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 className="stat-label" style={{ margin: 0 }}>Top Customers</h3>
                        <Link href="/admin/analytics/top-customers" className="admin-btn admin-btn-outline" style={{ padding: '6px 12px', fontSize: '11px' }}>
                            View All
                        </Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {data.topCustomers.slice(0, 8).map((c, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ 
                                        width: '32px', 
                                        height: '32px', 
                                        borderRadius: '50%', 
                                        background: `hsl(${i * 40}, 60%, 75%)`, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        fontSize: '12px', 
                                        fontWeight: 600,
                                        color: '#333'
                                    }}>
                                        {c.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{c.name}</div>
                                        <div style={{ fontSize: '11px', color: '#999' }}>{c.orders} orders</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--admin-accent)' }}>{formatCurrency(c.revenue)}</div>
                            </div>
                        ))}
                        {data.topCustomers.length === 0 && (
                            <div style={{ fontSize: '13px', color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
                                No customers yet
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 className="stat-label" style={{ margin: 0 }}>Recent Activity</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {data.recentActivity.slice(0, 8).map((a, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <div style={{ 
                                    width: '8px', 
                                    height: '8px', 
                                    borderRadius: '50%', 
                                    background: 'var(--admin-accent)', 
                                    marginTop: '6px',
                                    flexShrink: 0
                                }} />
                                <div>
                                    <div style={{ fontSize: '12px', lineHeight: 1.4 }}>{a.description}</div>
                                    <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                                        {formatTimeAgo(a.time)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {data.recentActivity.length === 0 && (
                            <div style={{ fontSize: '13px', color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
                                No recent activity
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Orders Table */}
            <div className="admin-card" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 className="stat-label" style={{ margin: 0 }}>Recent Orders</h3>
                    <Link href="/admin/analytics/recent-orders" className="admin-btn admin-btn-outline" style={{ padding: '6px 12px', fontSize: '11px' }}>
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
                                        {formatCurrency(order.total)}
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${order.status.toLowerCase()}`}>{getStatusLabel(order.status)}</span>
                                    </td>
                                </tr>
                            ))}
                            {data.recentOrders.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                                        No recent orders
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Stats Footer */}
            <div className="admin-card" style={{ marginTop: '24px', background: 'var(--admin-bg-dark)', color: '#fff' }}>
                <h3 className="stat-label" style={{ color: 'var(--admin-accent)', marginBottom: '16px' }}>Quick Stats</h3>
                <StatsGrid items={[
                    { label: 'Total Revenue', value: formatCurrency(data.totalRevenue), icon: '💰' },
                    { label: 'Total Orders', value: data.totalOrders, icon: '📦' },
                    { label: 'Total Customers', value: data.totalCustomers, icon: '👥' },
                    { label: 'Avg Order Value', value: formatCurrency(data.averageOrderValue), icon: '📊' },
                    { label: 'Repeat Rate', value: `${data.repeatCustomerRate}%`, icon: '🔄' },
                    { label: 'Low Stock Items', value: data.lowStockCount, icon: '⚠️' }
                ]} />
            </div>
        </div>
    );
}

// ============================================
// Helper Components
// ============================================

function KPICard({ label, value, trend, icon }: { label: string, value: string, trend: number, icon: string }) {
    const trendUp = trend >= 0;
    return (
        <div className="admin-card kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="stat-label">{label}</div>
                <span style={{ fontSize: '24px' }}>{icon}</span>
            </div>
            <div className="stat-value">{value}</div>
            <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px' }}>
                <span style={{ 
                    color: trendUp ? '#166534' : '#b91c1c', 
                    background: trendUp ? '#dcfce7' : '#fee2e2',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600
                }}>
                    {trendUp ? '▲' : '▼'} {Math.abs(trend)}%
                </span>
                <span style={{ color: '#999' }}>vs previous period</span>
            </div>
        </div>
    );
}

function MiniKPICard({ label, value, icon, color }: { label: string, value: string, icon: string, color: string }) {
    const colorMap: Record<string, { bg: string, text: string }> = {
        green: { bg: '#dcfce7', text: '#166534' },
        red: { bg: '#fee2e2', text: '#b91c1c' },
        blue: { bg: '#dbeafe', text: '#1e40af' },
        purple: { bg: '#f3e8ff', text: '#7c3aed' },
        gold: { bg: '#fef3c7', text: '#92400e' },
        gray: { bg: '#f3f4f6', text: '#4b5563' }
    };
    const colors = colorMap[color] || colorMap.gray;

    return (
        <div className="admin-card mini-kpi-card" style={{ 
            background: colors.bg,
            border: 'none'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>{icon}</span>
                <div>
                    <div style={{ fontSize: '11px', color: colors.text, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: colors.text }}>{value}</div>
                </div>
            </div>
        </div>
    );
}

function AlertCard({ type, title, value, description, link, linkText }: {
    type: 'warning' | 'info';
    title: string;
    value: string;
    description: string;
    link: string;
    linkText: string;
}) {
    const styles = type === 'warning' 
        ? { border: '1px solid #fbbf24', bg: '#fffbeb', accent: '#d97706' }
        : { border: '1px solid #60a5fa', bg: '#eff6ff', accent: '#2563eb' };

    return (
        <div className="admin-card" style={{ 
            flex: 1,
            background: styles.bg,
            borderColor: styles.border,
            borderLeftWidth: '4px',
            borderLeftColor: styles.accent
        }}>
            <h3 className="stat-label" style={{ color: styles.accent }}>{title}</h3>
            <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', fontFamily: 'Playfair Display, serif' }}>
                {value}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                {description}
            </div>
            <Link href={link} style={{ display: 'inline-block', marginTop: '12px', fontSize: '13px', color: styles.accent, textDecoration: 'underline' }}>
                {linkText} →
            </Link>
        </div>
    );
}

// ============================================
// Helper Functions
// ============================================

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-EG', { 
        style: 'currency', 
        currency: 'EGP', 
        maximumFractionDigits: 0 
    }).format(value);
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        'pending': 'Pending',
        'processing': 'Processing',
        'shipped': 'Shipped',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled',
        'paid': 'Paid'
    };
    return labels[status] || status;
}

function formatTimeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
