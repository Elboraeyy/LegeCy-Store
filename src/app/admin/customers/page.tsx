import Link from 'next/link';
import { fetchCustomers } from '@/lib/actions/customer';
import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import EmptyState from '@/components/admin/EmptyState';
import '@/app/admin/admin.css';

const PAGE_SIZE = 10;

export default async function CustomersPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    const resolvedSearchParams = await searchParams;
    const page = Number(resolvedSearchParams.page) || 1;
    const search = (resolvedSearchParams.search as string) || '';

    const { data: customers, total } = await fetchCustomers({ page, search, pageSize: PAGE_SIZE });
    const totalNum = total || 0;
    const totalPages = Math.ceil(totalNum / PAGE_SIZE);

    const buildUrl = (params: Record<string, string | number | undefined>) => {
        const urlParams = new URLSearchParams();
        if (params.search) urlParams.set('search', String(params.search));
        if (typeof params.page === 'number' && params.page > 1) urlParams.set('page', String(params.page));
        const query = urlParams.toString();
        return `/admin/customers${query ? `?${query}` : ''}`;
    };

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Customers</h1>
                    <p className="admin-subtitle">View and manage registered users</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ 
                        fontSize: '13px', 
                        color: 'var(--admin-text-muted)', 
                        background: '#fff', 
                        padding: '8px 16px', 
                        borderRadius: '99px', 
                        border: '1px solid var(--admin-border)' 
                    }}>
                        {totalNum} Total Customers
                    </span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="admin-toolbar">
                <div className="admin-tabs-container">
                    <span className="admin-tab-pill active">All Customers</span>
                </div>

                {/* Search */}
                <form className="admin-search-wrapper">
                    <span className="admin-search-icon">🔍</span>
                    <input
                        type="text"
                        name="search"
                        placeholder="Search by name or email..."
                        defaultValue={search}
                        className="admin-search-input"
                        autoComplete="off"
                    />
                </form>
            </div>

            {/* Data Table */}
            {customers.length > 0 ? (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Contact</th>
                                <th>Orders</th>
                                <th>Total Spent</th>
                                <th>Last Active</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((c) => (
                                <tr key={c.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ 
                                                width: '36px', 
                                                height: '36px', 
                                                borderRadius: '50%', 
                                                background: 'var(--admin-bg-dark)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                color: '#fff'
                                            }}>
                                                {c.name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <span style={{ fontWeight: 600, color: 'var(--admin-text-on-light)' }}>
                                                {c.name || 'Guest/Unknown'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--admin-text-muted)' }}>{c.email}</td>
                                    <td>
                                        <span style={{ 
                                            padding: '4px 10px', 
                                            borderRadius: '12px', 
                                            background: c.totalOrders > 0 ? 'rgba(22, 101, 52, 0.1)' : '#f0f0f0', 
                                            fontSize: '12px', 
                                            fontWeight: 600,
                                            color: c.totalOrders > 0 ? '#166534' : '#999'
                                        }}>
                                            {c.totalOrders}
                                        </span>
                                    </td>
                                    <td style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: '15px' }}>
                                        {new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(c.totalSpend)}
                                    </td>
                                    <td style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                                        {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Link 
                                            href={`/admin/customers/${c.id}`}
                                            className="admin-btn admin-btn-outline"
                                            style={{ padding: '8px 16px', fontSize: '11px' }}
                                        >
                                            View Profile
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    icon="👥"
                    title={search ? 'No customers found' : 'No customers yet'}
                    description={search ? 'Try adjusting your search criteria' : 'Customers will appear here once they register'}
                />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '40px' }}>
                    <Link
                        href={buildUrl({ search, page: page - 1 })}
                        className={`admin-btn admin-btn-outline ${page <= 1 ? 'disabled' : ''}`}
                        style={{ pointerEvents: page <= 1 ? 'none' : 'auto', opacity: page <= 1 ? 0.5 : 1 }}
                    >
                        Previous
                    </Link>
                    <span style={{ padding: '10px 16px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        Page {page} of {totalPages}
                    </span>
                    <Link
                        href={buildUrl({ search, page: page + 1 })}
                        className={`admin-btn admin-btn-outline ${page >= totalPages ? 'disabled' : ''}`}
                        style={{ pointerEvents: page >= totalPages ? 'none' : 'auto', opacity: page >= totalPages ? 0.5 : 1 }}
                    >
                        Next
                    </Link>
                </div>
            )}
        </div>
    );
}
