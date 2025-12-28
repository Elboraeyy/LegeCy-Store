"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

import { DashboardStats } from "../../dashboard-actions";

export function ActivityFeed({ initialActivity }: { initialActivity: DashboardStats['lists']['recentActivity'] }) {
    return (
        <div className="admin-card">
            <div className="stat-label" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Recent Activity</span>
                <Link href="/admin/orders" style={{ fontSize: '12px', color: 'var(--admin-primary)' }}>View All</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {initialActivity.map((item) => (
                    <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ 
                            width: '32px', height: '32px', 
                            borderRadius: '50%', 
                            background: '#eff6ff', 
                            color: '#3b82f6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px'
                        }}>
                            📦
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--admin-text)' }}>
                                {item.message}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                                {new Date(item.date).toLocaleString()} • {formatCurrency(item.amount)}
                            </div>
                        </div>
                        <span className={`status-badge status-${item.status.toLowerCase()}`} style={{ fontSize: '10px' }}>
                            {item.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
