"use client";

import React from "react";
import { DashboardStats } from '../../dashboard-actions';

interface StatCardProps {
    label: string;
    value: number | string;
    change?: number; // percentage
    prefix?: string;
    suffix?: string;
    description?: string;
    color?: string; // Hex for graph line or accent
}

export function StatCard({ label, value, change, prefix = '', suffix = '', description, color = '#3b82f6' }: StatCardProps) {
    const isPositive = change !== undefined && change >= 0;
    
    return (
        <div className="admin-card" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Background accent */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: color, filter: 'blur(60px)', opacity: 0.15 }}></div>
            
            <div style={{ color: 'var(--admin-text-muted)', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                {label}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--admin-text-muted)' }}>{prefix}</span>
                <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--admin-text)', fontFamily: 'var(--font-heading)' }}>
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--admin-text-muted)' }}>{suffix}</span>
            </div>

            {change !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                    <span style={{ 
                        color: isPositive ? '#16a34a' : '#dc2626', 
                        background: isPositive ? '#dcfce7' : '#fee2e2',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>vs last period</span>
                </div>
            )}
            
            {description && (
                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '8px' }}>
                    {description}
                </div>
            )}
        </div>
    );
}

export function StatsGrid({ stats }: { stats: DashboardStats }) {
    return (
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <StatCard 
                label="Total Revenue" 
                value={stats.kpi.revenue.value} 
                change={stats.kpi.revenue.change} 
                prefix="EGP" 
                color="#10b981"
            />
            <StatCard 
                label="Total Orders" 
                value={stats.kpi.orders.value} 
                change={stats.kpi.orders.change} 
                color="#3b82f6"
            />
            <StatCard 
                label="Avg. Order Value" 
                value={Math.round(stats.kpi.aov.value)} 
                prefix="EGP" 
                change={stats.kpi.aov.change}
                color="#8b5cf6"
            />
            <StatCard 
                label="Pending Action" 
                value={stats.kpi.pending.value} 
                description="Orders awaiting fulfillment"
                color="#f59e0b"
            />
        </div>
    );
}
