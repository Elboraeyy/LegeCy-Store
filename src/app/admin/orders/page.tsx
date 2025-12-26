import { fetchAdminOrders } from '../actions';
import { OrderStatus } from '@/lib/orderStatus';
import Link from 'next/link';
import { Decimal } from '@prisma/client/runtime/library';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
        style: 'currency',
        currency: 'EGP',
    }).format(amount);
};

const getStatusClass = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.Paid: return 'status-paid';
        case OrderStatus.Shipped: return 'status-shipped';
        case OrderStatus.Delivered: return 'status-delivered';
        case OrderStatus.Cancelled: return 'status-cancelled';
        case OrderStatus.Pending: return 'status-pending';
        default: return 'status-pending';
    }
};

export default async function OrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams;
    const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page) : 1;
    const status = typeof resolvedParams.status === 'string' ? (resolvedParams.status as OrderStatus) : undefined;
    const search = typeof resolvedParams.search === 'string' ? resolvedParams.search : undefined;

    const { data: orders } = await fetchAdminOrders({ page, status, search });

    const statusFilters = [
        { value: '', label: 'All Orders' },
        { value: 'pending', label: 'Pending' },
        { value: 'paid', label: 'Paid' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Orders Management</h1>
                    <p className="admin-subtitle">Track and fulfill customer orders</p>
                </div>
                <Link href="/admin/orders/export" className="admin-btn admin-btn-outline">
                    <span>⬇️</span> Export CSV
                </Link>
            </div>

            {/* Filters & Actions */}
            {/* Filters & Actions */}
            <div className="admin-toolbar">
                {/* Status Tabs */}
                <div className="admin-tabs-container">
                    {statusFilters.map((filter) => {
                        const isActive = (status || '') === filter.value;
                        return (
                            <Link
                                key={filter.value}
                                href={`/admin/orders${filter.value ? `?status=${filter.value}` : ''}`}
                                className={`admin-tab-pill ${isActive ? 'active' : ''}`}
                            >
                                {filter.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Search */}
                <form className="admin-search-wrapper">
                    <span className="admin-search-icon">🔍</span>
                    <input
                        type="text"
                        name="search"
                        placeholder="Search Order ID..."
                        defaultValue={search}
                        className="admin-search-input"
                        autoComplete="off"
                    />
                </form>
            </div>

            {/* Data Table */}
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Status</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => {
                            const statusClass = getStatusClass(order.status);
                            return (
                                <tr key={order.id}>
                                    <td>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px', background: 'rgba(0,0,0,0.03)', padding: '4px 8px', borderRadius: '4px' }}>
                                            #{order.id.slice(0, 8)}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{order.user?.name || 'Guest User'}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{order.user?.email}</div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${statusClass}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600, fontFamily: 'var(--font-heading)', fontSize: '15px' }}>
                                        {formatCurrency(new Decimal(order.totalPrice).toNumber())}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px', fontWeight: 500 }}>
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Link href={`/admin/orders/${order.id}`} className="admin-btn admin-btn-outline" style={{ padding: '8px 16px', fontSize: '11px' }}>
                                            Manage
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '60px' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 }}>📭</div>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>No orders found</h3>
                                    <p style={{ color: 'var(--admin-text-muted)', margin: 0 }}>Try adjusting your search or filters</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {orders.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '40px' }}>
                    <Link
                        href={`/admin/orders?page=${page - 1}${status ? `&status=${status}` : ''}`}
                        className={`admin-btn admin-btn-outline ${page <= 1 ? 'disabled' : ''}`}
                        style={{ pointerEvents: page <= 1 ? 'none' : 'auto', opacity: page <= 1 ? 0.5 : 1 }}
                    >
                        Previous
                    </Link>
                    <span style={{ padding: '10px 16px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                         Page {page}
                    </span>
                    <Link
                        href={`/admin/orders?page=${page + 1}${status ? `&status=${status}` : ''}`}
                        className={`admin-btn admin-btn-outline ${orders.length < 10 ? 'disabled' : ''}`}
                    >
                        Next
                    </Link>
                </div>
            )}
        </div>
    );
}
