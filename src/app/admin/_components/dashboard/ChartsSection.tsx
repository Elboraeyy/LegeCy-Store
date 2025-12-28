"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useMemo } from 'react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

import { DashboardStats } from '../../dashboard-actions';

// ... imports

export function ChartsSection({ charts }: { charts: DashboardStats['charts'] }) {
    // Memoize chart data to prevent re-renders if parent re-renders
    const revenueData = useMemo(() => charts.revenue, [charts.revenue]);
    const statusData = useMemo(() => charts.status, [charts.status]);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '24px' }}>
            <div className="admin-card">
                <div className="stat-label" style={{ marginBottom: '20px' }}>Revenue Trend</div>
                <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                            {/* ... defs ... */}
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 11, fill: '#64748b' }} 
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(str: string) => {
                                    const date = new Date(str);
                                    return `${date.getDate()}/${date.getMonth() + 1}`;
                                }}
                            />
                            <YAxis 
                                tick={{ fontSize: 11, fill: '#64748b' }} 
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(num: number) => `EGP ${num / 1000}k`}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value: number | undefined) => [formatCurrency(value || 0), 'Revenue']}
                                labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorRevenue)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="admin-card">
                <div className="stat-label" style={{ marginBottom: '20px' }}>Order Status</div>
                <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry: { name: string; value: number }, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number | undefined) => [value || 0, 'Orders']} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
