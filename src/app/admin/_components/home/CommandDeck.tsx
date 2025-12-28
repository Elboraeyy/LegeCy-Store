'use client';

import Link from 'next/link';

interface CommandDeckProps {
    pendingOrders: number;
    todayRevenue: number;
    lowStockCount: number;
}

export default function CommandDeck({ pendingOrders, todayRevenue, lowStockCount }: CommandDeckProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-EG', {
            style: 'currency',
            currency: 'EGP',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const tiles = [
        {
            href: '/admin/orders',
            title: 'Orders',
            icon: '📦',
            stat: pendingOrders,
            statLabel: 'Pending',
            highlight: pendingOrders > 0
        },
        {
            href: '/admin/products',
            title: 'Products',
            icon: '🏷️',
            stat: lowStockCount,
            statLabel: 'Low Stock',
            highlight: lowStockCount > 0
        },
        {
            href: '/admin/customers',
            title: 'Customers',
            icon: '👥',
            stat: null,
            statLabel: 'View All',
            highlight: false
        },
        {
            href: '/admin/inventory',
            title: 'Inventory',
            icon: '🏭',
            stat: null,
            statLabel: 'Manage Stock',
            highlight: false
        }
    ];

    return (
        <div>
            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 600, margin: 0, color: 'var(--admin-text-on-light)' }}>
                    Command Deck
                </h2>
                <span style={{ fontSize: '14px', color: 'var(--admin-text-muted)' }}>Quick Navigation</span>
            </div>

            {/* Tiles Grid */}
            <div className="admin-grid" style={{ marginBottom: '24px' }}>
                {tiles.map(tile => (
                    <Link 
                        key={tile.href}
                        href={tile.href} 
                        className="admin-card"
                        style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', position: 'relative' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <span style={{ fontSize: '28px' }}>{tile.icon}</span>
                            <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--admin-text-on-light)' }}>{tile.title}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                            {tile.stat !== null ? (
                                <>
                                    <div className="stat-value" style={{ color: tile.highlight ? 'var(--admin-accent)' : 'var(--admin-text-on-light)' }}>
                                        {tile.stat}
                                    </div>
                                    <div className="stat-label">{tile.statLabel}</div>
                                </>
                            ) : (
                                <div className="stat-label">{tile.statLabel}</div>
                            )}
                        </div>
                    </Link>
                ))}
            </div>

            {/* Revenue Highlight */}
            <div className="admin-card" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '20px',
                background: 'var(--admin-surface-light)',
                border: '1px solid var(--admin-border)'
            }}>
                <span style={{ fontSize: '40px' }}>💰</span>
                <div style={{ flex: 1 }}>
                    <div className="stat-label">Today&apos;s Revenue</div>
                    <div className="stat-value" style={{ color: '#166534' }}>{formatCurrency(todayRevenue)}</div>
                </div>
                <Link href="/admin/orders" className="admin-btn admin-btn-outline">
                    View Details →
                </Link>
            </div>
        </div>
    );
}
