import Link from 'next/link';
import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import '@/app/admin/admin.css';

export const dynamic = 'force-dynamic';

export default async function RecentOrdersPage() {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    // Get recent orders with details
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
            user: { select: { name: true, email: true } },
            items: { select: { name: true, quantity: true, price: true } }
        }
    });

    // Calculate stats
    const todayOrders = orders.filter(o => {
        const today = new Date();
        const orderDate = new Date(o.createdAt);
        return orderDate.toDateString() === today.toDateString();
    });
    
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0);

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link href="/admin/analytics" className="back-btn" style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                    }}>
                        ←
                    </Link>
                    <div>
                        <h1 className="admin-title">Recent Orders</h1>
                        <p className="admin-subtitle">Latest 100 orders across all time</p>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="analytics-kpi-grid" style={{ marginBottom: '24px' }}>
                <div className="admin-card mini-kpi-card" style={{ background: '#dcfce7', border: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>📦</span>
                        <div>
                            <div style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Total Orders</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#166534' }}>
                                {orders.length}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="admin-card mini-kpi-card" style={{ background: '#fef3c7', border: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>💰</span>
                        <div>
                            <div style={{ fontSize: '11px', color: '#92400e', textTransform: 'uppercase', fontWeight: 600 }}>Total Revenue</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#92400e' }}>
                                {formatCurrency(totalRevenue)}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="admin-card mini-kpi-card" style={{ background: '#dbeafe', border: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>🌟</span>
                        <div>
                            <div style={{ fontSize: '11px', color: '#1e40af', textTransform: 'uppercase', fontWeight: 600 }}>Orders Today</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e40af' }}>
                                {todayOrders.length}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="admin-card mini-kpi-card" style={{ background: '#f3e8ff', border: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>📈</span>
                        <div>
                            <div style={{ fontSize: '11px', color: '#7c3aed', textTransform: 'uppercase', fontWeight: 600 }}>Today&apos;s Revenue</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#7c3aed' }}>
                                {formatCurrency(todayRevenue)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="admin-card">
                <div className="admin-table-container" style={{ border: 'none', boxShadow: 'none' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                            #{order.id.slice(0, 8)}
                                        </span>
                                    </td>
                                    <td>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>
                                                {order.user?.name || order.customerName || 'Guest'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#999' }}>
                                                {order.user?.email || order.customerEmail || '-'}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px' }}>
                                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                            <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                                                {order.items.slice(0, 2).map(i => i.name).join(', ')}
                                                {order.items.length > 2 && '...'}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700, fontSize: '15px' }}>
                                        {formatCurrency(Number(order.totalPrice))}
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${order.status.toLowerCase()}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '12px', color: '#666' }}>
                                        {new Date(order.createdAt).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td>
                                        <Link 
                                            href={`/admin/orders/${order.id}`}
                                            className="admin-btn admin-btn-outline"
                                            style={{ padding: '6px 12px', fontSize: '11px' }}
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                                        No orders yet
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
