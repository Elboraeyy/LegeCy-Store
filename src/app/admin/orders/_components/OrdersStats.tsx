"use client";

import Link from "next/link";
import { formatCurrency } from "../../../../lib/utils";

interface StatsData {
    totalOrders: number;
    pendingOrders: number;
    monthlyRevenue: number;
}

interface OrdersStatsProps {
    stats: StatsData;
}

export default function OrdersStats({ stats }: OrdersStatsProps) {
    return (
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {/* Total Orders */}
            <div className="admin-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="stat-label">Total Orders</span>
                    <span style={{ fontSize: '20px' }}>📦</span>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--admin-text)' }}>
                    {stats.totalOrders}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                    Lifetime orders count
                </div>
            </div>

            {/* Pending Orders */}
            <div className="admin-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="stat-label">Pending</span>
                    <span style={{ fontSize: '20px' }}>⏳</span>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>
                    {stats.pendingOrders}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                    Orders needing attention
                </div>
            </div>

            {/* Monthly Revenue */}
            <div className="admin-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="stat-label">This Month</span>
                    <span style={{ fontSize: '20px' }}>💰</span>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>
                    {formatCurrency(stats.monthlyRevenue)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                    Revenue so far
                </div>
            </div>

            {/* Quick Action - Create Manual Order */}
            <Link href="/admin/orders/create" className="admin-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--admin-bg-hover)', border: '1px dashed var(--admin-border)', cursor: 'pointer', textDecoration: 'none' }}>
                <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 500, color: 'var(--admin-bg-dark)' }}>
                    + Create Manual Order
                </div>
            </Link>
        </div>
    );
}
