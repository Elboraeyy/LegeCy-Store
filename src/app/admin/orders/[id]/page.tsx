'use client';

import { Suspense, useState, useEffect, use } from 'react';
import Link from 'next/link';
import { fetchOrderDetails } from '../../actions';
import '@/app/admin/admin.css';
import StatusUpdateControl from '@/components/admin/StatusUpdateControl';

type OrderDetail = Awaited<ReturnType<typeof fetchOrderDetails>>;

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    return (
        <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Order Context...</div>}>
            <OrderDetailsView id={resolvedParams.id} />
        </Suspense>
    );
}

function OrderDetailsView({ id }: { id: string }) {
    const [order, setOrder] = useState<OrderDetail>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchOrderDetails(id)
            .then(data => {
                if (!data) setError('Order not found or access denied.');
                else setOrder(data);
            })
            .catch(err => {
                console.error(err);
                setError('System error while loading order.');
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="admin-card" style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>;
    if (error) return <div className="admin-card" style={{ textAlign: 'center', padding: '60px', color: '#cc0000' }}>Error: {error}</div>;
    if (!order) return null;

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                         <Link href="/admin/orders" style={{ textDecoration: 'none', color: 'var(--admin-text-muted)', fontSize: '14px' }}>
                            ← Back to Orders
                         </Link>
                         <span style={{ color: 'var(--admin-border)' }}>|</span>
                         <span style={{ fontSize: '14px', color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>#{order.id.slice(0, 8)}</span>
                    </div>
                    <h1 className="admin-title">Order Details</h1>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <StatusUpdateControl orderId={order.id} currentStatus={order.status} />
                    <button className="admin-btn admin-btn-outline">Download Invoice</button>
                </div>
            </div>

            <div className="admin-grid" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>
                
                {/* Left Column: Line Items & Totals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--admin-border)', background: '#fafafa' }}>
                             <h3 className="admin-label" style={{ margin: 0, fontSize: '15px' }}>Line Items</h3>
                        </div>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Price</th>
                                    <th>Qty</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{item.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>
                                                {item.variant ? item.variant.sku : item.productId}
                                            </div>
                                        </td>
                                        <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(item.price))}</td>
                                        <td>{item.quantity}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(item.price) * item.quantity)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ padding: '24px', background: '#fafafa', borderTop: '1px solid var(--admin-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '32px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginBottom: '4px' }}>Subtotal</div>
                                    <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginBottom: '4px' }}>Shipping</div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '12px' }}>Total</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(order.totalPrice))}
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Free</div>
                                    <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: 'var(--admin-accent)' }}>
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(order.totalPrice))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="admin-card">
                         <h3 className="admin-label" style={{ marginBottom: '20px' }}>Order Timeline</h3>
                         <div style={{ position: 'relative', paddingLeft: '16px' }}>
                            <div style={{ position: 'absolute', left: '0', top: '8px', bottom: '0', width: '2px', background: 'var(--admin-border)' }}></div>
                            {order.history.map(h => (
                                <div key={h.id} style={{ position: 'relative', paddingLeft: '24px', marginBottom: '24px' }}>
                                    <div style={{ 
                                        position: 'absolute', 
                                        left: '-5px', 
                                        top: '6px', 
                                        width: '12px', 
                                        height: '12px', 
                                        borderRadius: '50%', 
                                        background: 'var(--admin-accent)', 
                                        border: '2px solid #fff' 
                                    }}></div>
                                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{h.to}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                                        {new Date(h.createdAt).toLocaleString()}
                                    </div>
                                    {h.reason && <div style={{ fontSize: '13px', marginTop: '4px', fontStyle: 'italic', background: '#f9f9f9', padding: '8px', borderRadius: '4px' }}>&quot;{h.reason}&quot;</div>}
                                </div>
                            ))}
                         </div>
                    </div>
                </div>

                {/* Right Column: Customer & Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Status Card */}
                    <div className="admin-card">
                        <h3 className="admin-label" style={{ marginBottom: '16px' }}>Current Status</h3>
                        <StatusBadge status={order.status} isLarge />
                        
                        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                            <label className="admin-label">Payment</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                {order.paymentIntent ? (
                                    <>
                                        <span style={{ 
                                            width: '8px', 
                                            height: '8px', 
                                            borderRadius: '50%', 
                                            background: order.paymentIntent.status === 'succeeded' ? '#166534' : '#b76e00'
                                        }}></span>
                                        {order.paymentIntent.status.toUpperCase()} via {order.paymentIntent.provider}
                                    </>
                                ) : (
                                    <span style={{ color: '#999' }}>No payment info</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Customer Card */}
                    <div className="admin-card">
                         <h3 className="admin-label" style={{ marginBottom: '16px' }}>Customer</h3>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                            <div style={{ 
                                width: '40px', 
                                height: '40px', 
                                borderRadius: '50%', 
                                background: 'var(--admin-sidebar-bg)', 
                                color: '#fff', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '18px'
                            }}>
                                {order.user?.name?.[0] || 'G'}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600 }}>{order.user?.name || 'Guest User'}</div>
                                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{order.user?.email}</div>
                            </div>
                         </div>
                         <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                             Customer ID: <span style={{ fontFamily: 'monospace' }}>{order.userId?.slice(0,8) || 'N/A'}</span>
                         </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status, isLarge }: { status: string, isLarge?: boolean }) {
    const statusLower = status.toLowerCase();
    let className = 'status-pending';
    if (statusLower === 'succeeded' || statusLower === 'paid' || statusLower === 'delivered') className = 'status-paid';
    else if (statusLower === 'shipped') className = 'status-shipped';
    else if (statusLower === 'cancelled') className = 'status-cancelled';

    return (
        <span className={`status-badge ${className}`} style={{ fontSize: isLarge ? '13px' : undefined, padding: isLarge ? '8px 16px' : undefined }}>
            {status}
        </span>
    );
}
