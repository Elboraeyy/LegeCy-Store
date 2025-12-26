import Link from 'next/link';
import { fetchCustomerDetails } from '@/lib/actions/customer';
import { validateAdminSession } from '@/lib/auth/session';
import { redirect, notFound } from 'next/navigation';
import '@/app/admin/admin.css';

export default async function CustomerDetailsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    const resolvedParams = await params;
    const customer = await fetchCustomerDetails(resolvedParams.id);

    if (!customer) notFound();

    return (
        <div>
             {/* Header */}
             <div className="admin-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                         <Link href="/admin/customers" style={{ textDecoration: 'none', color: 'var(--admin-text-muted)', fontSize: '14px' }}>
                            ← Back to Customers
                         </Link>
                         <span style={{ color: 'var(--admin-border)' }}>|</span>
                         <span style={{ fontSize: '14px', color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>#{customer.id.slice(0, 8)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '50%', 
                            background: 'var(--admin-sidebar-bg)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            fontWeight: 600
                        }}>
                            {customer.name?.[0] || 'U'}
                        </div>
                        <div>
                            <h1 className="admin-title" style={{ marginBottom: '4px' }}>{customer.name || 'Unknown User'}</h1>
                            <p className="admin-subtitle" style={{ margin: 0 }}>{customer.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="admin-grid" style={{ marginBottom: '32px' }}>
                <div className="admin-card">
                    <div className="admin-stat-label">Total Spent</div>
                    <div className="admin-stat-value">
                        {new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(customer.totalSpend)}
                    </div>
                </div>
                <div className="admin-card">
                    <div className="admin-stat-label">Total Orders</div>
                    <div className="admin-stat-value">{customer.orders.length}</div>
                </div>
                <div className="admin-card">
                    <div className="admin-stat-label">Member Since</div>
                    <div className="admin-stat-value" style={{ fontSize: '20px' }}>
                        {new Date(customer.createdAt).toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* Order History */}
            <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--admin-border)', background: '#fafafa' }}>
                        <h3 className="admin-label" style={{ margin: 0, fontSize: '16px' }}>Order History</h3>
                </div>
                {customer.orders.length > 0 ? (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Items</th>
                                <th>Amount</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customer.orders.map(order => (
                                <tr key={order.id}>
                                    <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>#{order.id.slice(0, 8)}</td>
                                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`status-badge ${
                                            order.status === 'delivered' || order.status === 'paid' ? 'status-paid' :
                                            order.status === 'cancelled' ? 'status-cancelled' : 'status-pending'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>{order.items.length} items</td>
                                    <td style={{ fontWeight: 600 }}>
                                        {new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(order.totalPrice)}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Link href={`/admin/orders/${order.id}`} className="admin-btn admin-btn-outline" style={{ fontSize: '11px', padding: '4px 12px' }}>
                                            View Order
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                        No orders found for this customer.
                    </div>
                )}
            </div>
        </div>
    );
}
