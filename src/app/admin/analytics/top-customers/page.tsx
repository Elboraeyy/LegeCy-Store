import Link from 'next/link';
import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import '@/app/admin/admin.css';

export const dynamic = 'force-dynamic';

export default async function TopCustomersPage() {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    // Get top customers with order details
    const topCustomersRaw = await prisma.order.groupBy({
        by: ['userId'],
        where: {
            userId: { not: null },
            status: { not: 'cancelled' }
        },
        _sum: { totalPrice: true },
        _count: { id: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 50
    });

    // Get customer details (only fields that exist in User model)
    const userIds = topCustomersRaw.map(c => c.userId).filter(Boolean) as string[];
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { 
            id: true, 
            name: true, 
            email: true,
            createdAt: true
        }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const topCustomers = topCustomersRaw.map(c => {
        const userDetails = c.userId ? userMap.get(c.userId) : null;
        return {
            id: c.userId || '',
            name: userDetails?.name || 'Guest',
            email: userDetails?.email || '',
            orders: c._count?.id || 0,
            revenue: Number(c._sum?.totalPrice || 0),
            joinedAt: userDetails?.createdAt
        };
    });

    const totalRevenue = topCustomers.reduce((sum, c) => sum + c.revenue, 0);
    const totalOrders = topCustomers.reduce((sum, c) => sum + c.orders, 0);

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
                        fontSize: '18px',
                        textDecoration: 'none',
                        color: '#333'
                    }}>
                        ←
                    </Link>
                    <div>
                        <h1 className="admin-title">Top Customers</h1>
                        <p className="admin-subtitle">Your most valuable customers by revenue</p>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="analytics-kpi-grid" style={{ marginBottom: '24px' }}>
                <div className="admin-card mini-kpi-card" style={{ background: '#dcfce7', border: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>👥</span>
                        <div>
                            <div style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Total Customers</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#166534' }}>
                                {topCustomers.length}
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
                        <span style={{ fontSize: '24px' }}>📦</span>
                        <div>
                            <div style={{ fontSize: '11px', color: '#1e40af', textTransform: 'uppercase', fontWeight: 600 }}>Total Orders</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e40af' }}>
                                {totalOrders.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="admin-card mini-kpi-card" style={{ background: '#f3e8ff', border: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>💎</span>
                        <div>
                            <div style={{ fontSize: '11px', color: '#7c3aed', textTransform: 'uppercase', fontWeight: 600 }}>Avg. per Customer</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#7c3aed' }}>
                                {formatCurrency(topCustomers.length > 0 ? totalRevenue / topCustomers.length : 0)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customers Table */}
            <div className="admin-card">
                <div className="admin-table-container" style={{ border: 'none', boxShadow: 'none' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>#</th>
                                <th>Customer</th>
                                <th>Email</th>
                                <th>Orders</th>
                                <th>Total Spent</th>
                                <th>Avg. Order</th>
                                <th>Member Since</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topCustomers.map((customer, i) => (
                                <tr key={customer.id || i}>
                                    <td>
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
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: `hsl(${i * 35}, 60%, 75%)`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '16px',
                                                fontWeight: 600,
                                                color: '#333'
                                            }}>
                                                {customer.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{customer.name}</div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '13px', color: '#666' }}>
                                        {customer.email || '-'}
                                    </td>
                                    <td style={{ fontWeight: 600 }}>
                                        {customer.orders}
                                    </td>
                                    <td style={{ fontWeight: 700, fontSize: '16px', color: 'var(--admin-accent)' }}>
                                        {formatCurrency(customer.revenue)}
                                    </td>
                                    <td>
                                        {formatCurrency(customer.orders > 0 ? customer.revenue / customer.orders : 0)}
                                    </td>
                                    <td style={{ fontSize: '12px', color: '#666' }}>
                                        {customer.joinedAt 
                                            ? new Date(customer.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                            : '-'
                                        }
                                    </td>
                                </tr>
                            ))}
                            {topCustomers.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                                        No customer data yet
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
