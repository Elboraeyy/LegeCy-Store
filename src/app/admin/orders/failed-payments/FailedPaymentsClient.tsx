"use client";

import { useState } from 'react';

interface FailedOrder {
    id: string;
    status: string;
    totalPrice: number;
    createdAt: string;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    paymentMethod: string | null;
    user: { name: string | null; email: string | null } | null;
    items: { name: string; quantity: number; price: number }[];
}

interface Props {
    orders: FailedOrder[];
}

export default function FailedPaymentsClient({ orders }: Props) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const failedCount = orders.filter(o => o.status === 'payment_failed').length;
    const pendingCount = orders.filter(o => o.status === 'payment_pending').length;

    return (
        <div>
            {/* Stats Row */}
            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div className="admin-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="stat-label">Payment Failed</span>
                        <span style={{ fontSize: '20px' }}>❌</span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444' }}>{failedCount}</div>
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Failed transactions</div>
                </div>
                <div className="admin-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="stat-label">Awaiting Payment</span>
                        <span style={{ fontSize: '20px' }}>⏳</span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>{pendingCount}</div>
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Pending confirmation</div>
                </div>
                <div className="admin-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="stat-label">Total</span>
                        <span style={{ fontSize: '20px' }}>📊</span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--admin-text)' }}>{orders.length}</div>
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Need attention</div>
                </div>
            </div>

            {/* Empty State */}
            {orders.length === 0 ? (
                <div className="admin-card" style={{ padding: '60px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No Failed Payments</h3>
                    <p style={{ color: 'var(--admin-text-muted)' }}>All payment attempts were successful</p>
                </div>
            ) : (
                /* Orders Table */
                <div className="admin-card" style={{ overflow: 'hidden' }}>
                    <table className="admin-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid var(--admin-border)' }}>Order ID</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid var(--admin-border)' }}>Status</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid var(--admin-border)' }}>Customer</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid var(--admin-border)' }}>Phone</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid var(--admin-border)' }}>Amount</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid var(--admin-border)' }}>Date</th>
                                <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid var(--admin-border)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <>
                                    <tr key={order.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                                        <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '13px' }}>{order.id.slice(0, 8)}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                background: order.status === 'payment_failed' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: order.status === 'payment_failed' ? '#ef4444' : '#f59e0b'
                                            }}>
                                                {order.status === 'payment_failed' ? 'Failed' : 'Pending'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: 500 }}>{order.customerName || order.user?.name || 'Unknown'}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{order.customerEmail || order.user?.email}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {order.customerPhone ? (
                                                <a href={`tel:${order.customerPhone}`} style={{ color: 'var(--admin-primary)', textDecoration: 'none' }}>
                                                    {order.customerPhone}
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td style={{ padding: '16px', fontWeight: 600 }}>{order.totalPrice.toFixed(2)} EGP</td>
                                        <td style={{ padding: '16px', fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                                            {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                {order.customerPhone && (
                                                    <a
                                                        href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            background: '#25D366',
                                                            color: 'white',
                                                            fontSize: '12px',
                                                            fontWeight: 500,
                                                            textDecoration: 'none',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        💬 WhatsApp
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        background: 'var(--admin-bg-hover)',
                                                        border: '1px solid var(--admin-border)',
                                                        color: 'var(--admin-text)',
                                                        fontSize: '12px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {expandedId === order.id ? 'Hide' : 'Details'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedId === order.id && (
                                        <tr key={`${order.id}-details`}>
                                            <td colSpan={7} style={{ padding: '20px', background: 'var(--admin-bg-hover)' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                                    <div>
                                                        <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Products</h4>
                                                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                                            {order.items.map((item, i) => (
                                                                <li key={i} style={{ marginBottom: '4px', fontSize: '13px' }}>
                                                                    {item.name} × {item.quantity} = {(item.price * item.quantity).toFixed(2)} EGP
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Contact Customer</h4>
                                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                            {order.customerPhone && (
                                                                <a
                                                                    href={`tel:${order.customerPhone}`}
                                                                    style={{
                                                                        padding: '8px 16px',
                                                                        borderRadius: '8px',
                                                                        background: 'var(--admin-primary)',
                                                                        color: 'white',
                                                                        fontSize: '13px',
                                                                        textDecoration: 'none'
                                                                    }}
                                                                >
                                                                    📞 Call
                                                                </a>
                                                            )}
                                                            {order.customerEmail && (
                                                                <a
                                                                    href={`mailto:${order.customerEmail}`}
                                                                    style={{
                                                                        padding: '8px 16px',
                                                                        borderRadius: '8px',
                                                                        background: 'var(--admin-bg)',
                                                                        border: '1px solid var(--admin-border)',
                                                                        color: 'var(--admin-text)',
                                                                        fontSize: '13px',
                                                                        textDecoration: 'none'
                                                                    }}
                                                                >
                                                                    ✉️ Email
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
