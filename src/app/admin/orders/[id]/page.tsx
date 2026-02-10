'use client';

import { Suspense, useState, useEffect, use } from 'react';
import { fetchOrderDetails } from '../../actions';
import '@/app/admin/admin.css';
import StatusUpdateControl from '@/components/admin/StatusUpdateControl';
import BackButton from '@/components/admin/BackButton';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

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
    const { language } = useLanguage();
    const t = adminDictionary[language];
    const [order, setOrder] = useState<OrderDetail>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const formatCurrency = (amount: number, currencyCode: string = 'EGP') => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
            style: 'currency',
            currency: currencyCode, // Use passed currency or default to EGP. original was USD but context suggests Egyptian store?
            // The original code used USD explicitly 'en-US', 'USD'. 
            // If the store is multi-currency, we should respect that. 
            // However, previous files used EGP. I will stick to EGP default or what's in DB if needed.
            // But looking at previous code, it was hardcoded USD. I'll switch to EGP to be consistent with previous OrdersTable 
            // OR keep it dynamic if I knew the currency. 
            // Let's assume EGP for now as per other admin pages.
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');
    };

    useEffect(() => {
        fetchOrderDetails(id)
            .then(data => {
                if (!data) setError(t.orders.details.not_found);
                else setOrder(data);
            })
            .catch(err => {
                console.error(err);
                setError(t.common.error);
            })
            .finally(() => setLoading(false));
    }, [id, t]);

    if (loading) return <div className="admin-card" style={{ textAlign: 'center', padding: '60px' }}>{t.orders.details.loading}</div>;
    if (error) return <div className="admin-card" style={{ textAlign: 'center', padding: '60px', color: '#cc0000' }}>Error: {error}</div>;
    if (!order) return null;

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                         <BackButton 
                            fallbackHref="/admin/orders" 
                            label={`← ${t.orders.details_page.back}`}
                            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--admin-text-muted)', fontSize: '14px', cursor: 'pointer' }}
                         />
                         <span style={{ color: 'var(--admin-border)' }}>|</span>
                         <span style={{ fontSize: '14px', color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>#{order.id.slice(0, 8)}</span>
                    </div>
                    <h1 className="admin-title">{t.orders.details.title}</h1>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <StatusUpdateControl orderId={order.id} currentStatus={order.status} />
                    <button className="admin-btn admin-btn-outline">{t.orders.details_page.download_invoice}</button>
                </div>
            </div>

            <div className="admin-grid" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>
                
                {/* Left Column: Line Items & Totals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--admin-border)', background: '#fafafa' }}>
                            <h3 className="admin-label" style={{ margin: 0, fontSize: '15px' }}>{t.orders.details_page.line_items}</h3>
                        </div>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'start' }}>{t.orders.details_page.item}</th>
                                    <th>{t.orders.details_page.price}</th>
                                    <th>{t.orders.details_page.qty}</th>
                                    <th style={{ textAlign: 'end' }}>{t.orders.details.total}</th>
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
                                        <td>{formatCurrency(Number(item.price))}</td>
                                        <td>{item.quantity}</td>
                                        <td style={{ textAlign: 'end', fontWeight: 600 }}>
                                            {formatCurrency(Number(item.price) * item.quantity)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ padding: '24px', background: '#fafafa', borderTop: '1px solid var(--admin-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '32px' }}>
                                <div style={{ textAlign: 'end' }}>
                                    <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginBottom: '4px' }}>{t.orders.details_page.subtotal}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginBottom: '4px' }}>{t.orders.details_page.shipping}</div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '12px' }}>{t.orders.details.total}</div>
                                </div>
                                <div style={{ textAlign: 'end' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                                        {formatCurrency(Number(order.totalPrice))}
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{t.orders.details_page.free}</div>
                                    <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: 'var(--admin-accent)' }}>
                                        {formatCurrency(Number(order.totalPrice))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="admin-card">
                        <h3 className="admin-label" style={{ marginBottom: '20px' }}>{t.orders.details_page.timeline}</h3>
                        <div style={{ position: 'relative', paddingLeft: language === 'ar' ? 0 : '16px', paddingRight: language === 'ar' ? '16px' : 0 }}>
                            <div style={{ position: 'absolute', left: language === 'ar' ? 'auto' : '0', right: language === 'ar' ? '0' : 'auto', top: '8px', bottom: '0', width: '2px', background: 'var(--admin-border)' }}></div>
                            {order.history.map(h => (
                                <div key={h.id} style={{ position: 'relative', paddingLeft: language === 'ar' ? 0 : '24px', paddingRight: language === 'ar' ? '24px' : 0, marginBottom: '24px' }}>
                                    <div style={{ 
                                        position: 'absolute', 
                                        left: language === 'ar' ? 'auto' : '-5px',
                                        right: language === 'ar' ? '-5px' : 'auto',
                                        top: '6px', 
                                        width: '12px', 
                                        height: '12px', 
                                        borderRadius: '50%', 
                                        background: 'var(--admin-accent)', 
                                        border: '2px solid #fff' 
                                    }}></div>
                                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{h.to}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                                        {formatDate(h.createdAt)}
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
                        <h3 className="admin-label" style={{ marginBottom: '16px' }}>{t.orders.details_page.current_status}</h3>
                        <StatusBadge status={order.status} isLarge />
                        
                        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                            <label className="admin-label">{t.orders.details_page.payment}</label>
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
                                        <span style={{ color: '#999' }}>{t.orders.details_page.no_payment_info}</span>
                                )}
                            </div>
                            {order.paymentIntent?.providerReference && (
                                <div style={{ marginTop: '12px', padding: '12px', background: '#fff9c4', borderRadius: '6px', border: '1px solid #fbc02d' }}>
                                    <label className="admin-label" style={{ color: '#8a6d3b', marginBottom: '4px' }}>{t.orders.details_page.verification_details}</label>
                                    <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 600, color: '#333' }}>
                                        {order.paymentIntent.providerReference}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#8a6d3b', marginTop: '4px' }}>
                                        {t.orders.details_page.check_bank}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Card */}
                    <div className="admin-card">
                        <h3 className="admin-label" style={{ marginBottom: '16px' }}>{t.orders.details.customer}</h3>
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
                                <div style={{ fontWeight: 600 }}>{order.user?.name || t.orders.details.guest}</div>
                                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{order.user?.email}</div>
                            </div>
                         </div>
                         <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                            {t.orders.details_page.customer_id}: <span style={{ fontFamily: 'monospace' }}>{order.userId?.slice(0, 8) || 'N/A'}</span>
                         </div>
                    </div>

                    {/* Shipping Card */}
                    <div className="admin-card">
                        <h3 className="admin-label" style={{ marginBottom: '16px' }}>{t.orders.details_page.shipping_delivery}</h3>
                        <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
                            <div>
                                <label className="admin-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: '4px' }}>{t.orders.details_page.name}</label>
                                <div>{order.customerName}</div>
                            </div>
                            <div>
                                <label className="admin-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: '4px' }}>{t.orders.details_page.contact}</label>
                                <div>{order.customerPhone}</div>
                                <div style={{ color: 'var(--admin-text-muted)' }}>{order.customerEmail}</div>
                            </div>
                            <div>
                                <label className="admin-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: '4px' }}>{t.orders.details_page.address}</label>
                                <div style={{ lineHeight: '1.4' }}>
                                    {order.shippingAddress}
                                    <br />
                                    {order.shippingCity}, {order.shippingGovernorate}
                                </div>
                            </div>
                            {order.shippingNotes && (
                                <div style={{ padding: '12px', background: '#fff9c4', borderRadius: '8px', borderLeft: '4px solid #fbc02d' }}>
                                    <label className="admin-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8a6d3b', display: 'block', marginBottom: '4px' }}>{t.orders.details_page.notes}</label>
                                    <div style={{ fontSize: '13px', color: '#8a6d3b' }}>{order.shippingNotes}</div>
                                </div>
                            )}
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
