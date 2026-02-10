"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { adminDictionary } from "@/lib/dictionaries/admin";

interface StatsData {
    totalOrders: number;
    pendingOrders: number;
    failedPayments: number;
    monthlyRevenue: number;
}

interface OrdersStatsProps {
    stats: StatsData;
}

export default function OrdersStats({ stats }: OrdersStatsProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
            style: 'currency',
            currency: 'EGP',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {/* Total Orders */}
            <div className="admin-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="admin-stat-card">
                    <div className="stat-icon-wrapper blue">
                        📦
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">{t.orders.stats.total_orders}</div>
                        <div className="stat-value">{stats.totalOrders}</div>
                    </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                    Lifetime orders count
                </div>
            </div>

            {/* Pending Orders */}
            <div className="admin-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="admin-stat-card">
                    <div className="stat-icon-wrapper yellow">
                        ⏳
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">{t.orders.stats.pending_orders}</div>
                        <div className="stat-value">{stats.pendingOrders}</div>
                    </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                    Orders needing attention
                </div>
            </div>

            {/* Monthly Revenue */}
            <div className="admin-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="admin-stat-card">
                    <div className="stat-icon-wrapper green">
                        💰
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">{t.orders.stats.revenue}</div>
                        <div className="stat-value">{formatCurrency(stats.monthlyRevenue)}</div>
                    </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                    Revenue so far
                </div>
            </div>

            {/* Failed Payments */}
            <Link
                href="/admin/orders/failed-payments"
                className="admin-card"
                style={{
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    textDecoration: 'none',
                    border: stats.failedPayments > 0 ? '2px solid #ef4444' : undefined,
                    background: stats.failedPayments > 0 ? 'rgba(239, 68, 68, 0.05)' : undefined
                }}
            >
                <div className="admin-stat-card">
                    <div className="stat-icon-wrapper red">
                        ⚠️
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">{t.orders.stats.failed_payments}</div>
                        <div className="stat-value">{stats.failedPayments}</div>
                    </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                    Click to view details →
                </div>
            </Link>

            {/* Quick Action - Create Manual Order */}
            <Link href="/admin/orders/create" className="admin-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--admin-bg-hover)', border: '1px dashed var(--admin-border)', cursor: 'pointer', textDecoration: 'none' }}>
                <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 500, color: 'var(--admin-bg-dark)' }}>
                    + Create Manual Order
                </div>
            </Link>
        </div>
    );
}
