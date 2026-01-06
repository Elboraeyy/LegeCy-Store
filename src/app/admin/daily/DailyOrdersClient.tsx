"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Order {
    id: string;
    totalPrice: number;
    status: string;
    orderSource: string;
    paymentMethod: string;
    createdAt: string;
    customerName: string | null;
    customerPhone: string | null;
    customerEmail: string | null;
    shippingCity: string | null;
    itemCount: number;
    user: { name: string | null; email: string | null } | null;
}

interface Stats {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    pendingCount: number;
    paidCount: number;
    shippedCount: number;
    deliveredCount: number;
    cancelledCount: number;
    sourceCounts: Record<string, { count: number; revenue: number }>;
    paymentCounts: Record<string, number>;
}

interface Props {
    orders: Order[];
    stats: Stats;
    currentDate: string;
    dateRange: { from: string; to: string } | null;
    currentSource: string;
}

const SOURCE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
    all: { label: 'All', emoji: '📊', color: '#1a3c34' },
    online: { label: 'Online', emoji: '🌐', color: '#3b82f6' },
    whatsapp: { label: 'WhatsApp', emoji: '💬', color: '#25d366' },
    instagram: { label: 'Instagram', emoji: '📸', color: '#e4405f' },
    facebook: { label: 'Facebook', emoji: '📘', color: '#1877f2' },
    call: { label: 'Call', emoji: '📞', color: '#f59e0b' },
    pos: { label: 'POS', emoji: '🏪', color: '#8b5cf6' }
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: '#b76e00', bg: '#fff4e5' },
    paid: { label: 'Paid', color: '#137333', bg: '#e6f4ea' },
    shipped: { label: 'Shipped', color: '#1967d2', bg: '#e8f0fe' },
    delivered: { label: 'Delivered', color: '#0d652d', bg: '#ceead6' },
    cancelled: { label: 'Cancelled', color: '#c5221f', bg: '#fce8e6' },
    payment_failed: { label: 'Failed', color: '#d32f2f', bg: '#ffebee' }
};

export default function DailyOrdersClient({ orders, stats, currentDate, dateRange, currentSource }: Props) {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState(currentDate);
    const [rangeMode, setRangeMode] = useState(!!dateRange);
    const [fromDate, setFromDate] = useState(dateRange?.from || currentDate);
    const [toDate, setToDate] = useState(dateRange?.to || currentDate);

    const formatPrice = (p: number) => `EGP ${p.toLocaleString()}`;
    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleString('en-EG', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleDateChange = () => {
        const params = new URLSearchParams();
        if (rangeMode) {
            params.set('from', fromDate);
            params.set('to', toDate);
        } else {
            params.set('date', selectedDate);
        }
        if (currentSource !== 'all') params.set('source', currentSource);
        router.push(`/admin/daily?${params.toString()}`);
    };

    const handleSourceChange = (source: string) => {
        const params = new URLSearchParams();
        if (rangeMode) {
            params.set('from', fromDate);
            params.set('to', toDate);
        } else {
            params.set('date', selectedDate);
        }
        if (source !== 'all') params.set('source', source);
        router.push(`/admin/daily?${params.toString()}`);
    };

    const navigateDay = (direction: 'prev' | 'next') => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
        const newDate = date.toISOString().split('T')[0];
        setSelectedDate(newDate);
        const params = new URLSearchParams();
        params.set('date', newDate);
        if (currentSource !== 'all') params.set('source', currentSource);
        router.push(`/admin/daily?${params.toString()}`);
    };

    const getDisplayName = (order: Order) => {
        return order.customerName || order.user?.name || order.customerEmail || 'Guest';
    };

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Daily Orders Report</h1>
                    <p className="admin-subtitle">View and analyze orders by date and source</p>
                </div>
            </div>

            {/* Date Controls */}
            <div className="admin-card" style={{ marginBottom: '24px', padding: '20px' }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Range Toggle */}
                    <div className="admin-tabs">
                        <button
                            onClick={() => setRangeMode(false)}
                            className={`admin-tab-item ${!rangeMode ? 'active' : ''}`}
                        >
                            Single Day
                        </button>
                        <button
                            onClick={() => setRangeMode(true)}
                            className={`admin-tab-item ${rangeMode ? 'active' : ''}`}
                        >
                            Date Range
                        </button>
                    </div>

                    {!rangeMode ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button onClick={() => navigateDay('prev')} className="admin-btn admin-btn-outline" style={{ padding: '8px 12px' }}>
                                ←
                            </button>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="admin-input"
                                style={{ width: '180px' }}
                            />
                            <button onClick={() => navigateDay('next')} className="admin-btn admin-btn-outline" style={{ padding: '8px 12px' }}>
                                →
                            </button>
                            <button onClick={handleDateChange} className="admin-btn admin-btn-primary">
                                Go
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="admin-input"
                                style={{ width: '160px' }}
                            />
                            <span style={{ color: '#666' }}>to</span>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="admin-input"
                                style={{ width: '160px' }}
                            />
                            <button onClick={handleDateChange} className="admin-btn admin-btn-primary">
                                Apply
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Source Tabs */}
            <div className="admin-tabs-container" style={{ marginBottom: '24px', padding: '8px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)' }}>
                {Object.entries(SOURCE_CONFIG).map(([key, config]) => (
                    <button
                        key={key}
                        onClick={() => handleSourceChange(key)}
                        className={`admin-tab-pill ${currentSource === key ? 'active' : ''}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: currentSource === key ? 'none' : '1px solid rgba(0,0,0,0.06)'
                        }}
                    >
                        <span>{config.emoji}</span>
                        <span>{config.label}</span>
                        {key !== 'all' && (
                            <span style={{
                                background: currentSource === key ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.06)',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '12px'
                            }}>
                                {stats.sourceCounts[key]?.count || 0}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Stats Cards */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '16px', 
                marginBottom: '24px' 
            }}>
                <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.06)'
                }}>
                    <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '12px', 
                        background: '#e8f0fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                    }}>📦</div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a3c34' }}>{stats.totalOrders}</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>Total Orders</div>
                    </div>
                </div>
                <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.06)'
                }}>
                    <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '12px', 
                        background: '#e6f4ea',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                    }}>💰</div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a3c34' }}>{formatPrice(stats.totalRevenue)}</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>Total Revenue</div>
                    </div>
                </div>
                <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.06)'
                }}>
                    <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '12px', 
                        background: '#fff4e5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                    }}>📊</div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a3c34' }}>{formatPrice(stats.avgOrderValue)}</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>Avg. Order Value</div>
                    </div>
                </div>
                <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.06)'
                }}>
                    <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '12px', 
                        background: '#fce8e6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                    }}>⏳</div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a3c34' }}>{stats.pendingCount}</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>Pending</div>
                    </div>
                </div>
            </div>

            {/* Source Breakdown */}
            <div className="admin-card" style={{ marginBottom: '24px', padding: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Orders by Source</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                    {Object.entries(SOURCE_CONFIG).filter(([k]) => k !== 'all').map(([key, config]) => {
                        const data = stats.sourceCounts[key] || { count: 0, revenue: 0 };
                        return (
                            <div key={key} style={{
                                padding: '16px',
                                borderRadius: '12px',
                                background: '#fafafa',
                                border: currentSource === key ? `2px solid ${config.color}` : '1px solid rgba(0,0,0,0.06)'
                            }}>
                                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{config.emoji}</div>
                                <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{config.label}</div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: config.color }}>{data.count}</div>
                                <div style={{ fontSize: '13px', color: '#666' }}>{formatPrice(data.revenue)}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Orders Table */}
            <div className="admin-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Orders ({orders.length})</h3>
                </div>
                
                {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                        <p>No orders found for this period</p>
                    </div>
                ) : (
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Source</th>
                                    <th>Payment</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => {
                                    const sourceConfig = SOURCE_CONFIG[order.orderSource] || SOURCE_CONFIG.online;
                                    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                                    return (
                                        <tr key={order.id}>
                                            <td style={{ whiteSpace: 'nowrap' }}>
                                                {formatDate(order.createdAt)}
                                            </td>
                                            <td>
                                                <code style={{ fontSize: '12px', background: '#f1f1f1', padding: '2px 6px', borderRadius: '4px' }}>
                                                    {order.id.slice(0, 8).toUpperCase()}
                                                </code>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '500' }}>{getDisplayName(order)}</div>
                                                {order.customerPhone && (
                                                    <div style={{ fontSize: '12px', color: '#666' }}>{order.customerPhone}</div>
                                                )}
                                            </td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    background: `${sourceConfig.color}15`,
                                                    color: sourceConfig.color,
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}>
                                                    {sourceConfig.emoji} {sourceConfig.label}
                                                </span>
                                            </td>
                                            <td style={{ textTransform: 'uppercase', fontSize: '12px' }}>
                                                {order.paymentMethod}
                                            </td>
                                            <td>{order.itemCount}</td>
                                            <td style={{ fontWeight: '600' }}>{formatPrice(order.totalPrice)}</td>
                                            <td>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    background: statusConfig.bg,
                                                    color: statusConfig.color,
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td>
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="admin-btn admin-btn-outline"
                                                    style={{ padding: '4px 10px', fontSize: '12px' }}
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
