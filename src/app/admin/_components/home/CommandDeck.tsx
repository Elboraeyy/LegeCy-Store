'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

interface CommandDeckProps {
    pendingOrders: number;
    todayRevenue: number;
    lowStockCount: number;
}

export default function CommandDeck({ pendingOrders, todayRevenue, lowStockCount }: CommandDeckProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
            style: 'currency',
            currency: 'EGP',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const tiles = [
        {
            href: '/admin/orders',
            title: t.sidebar.orders,
            icon: '📦',
            stat: pendingOrders,
            statLabel: 'Pending',
            highlight: pendingOrders > 0
        },
        {
            href: '/admin/products',
            title: t.sidebar.products,
            icon: '🏷️',
            stat: lowStockCount,
            statLabel: 'Low Stock',
            highlight: lowStockCount > 0
        },
        {
            href: '/admin/customers',
            title: t.sidebar.customers,
            icon: '👥',
            stat: null,
            statLabel: t.common.view,
            highlight: false
        },
        {
            href: '/admin/inventory',
            title: t.sidebar.inventory,
            icon: '🏭',
            stat: null,
            statLabel: t.common.actions,
            highlight: false
        }
    ];

    return (
        <div>
            {/* Section Header */}
            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 600, margin: 0, color: 'var(--admin-text-on-light)' }}>
                    {t.dashboard.quick_actions}
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
