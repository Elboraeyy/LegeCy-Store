'use client';

import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface DashboardChartsProps {
  statusData: { status: string; count: number }[];
  timelineData: { date: string; orders: number; revenue: number }[];
}

export function DashboardCharts({ statusData, timelineData }: DashboardChartsProps) {
  // Theme Colors
  const THEME = {
    background: 'var(--surface-glass)',
    border: 'var(--border)',
    text: 'var(--text-on-dark)',
    grid: 'rgba(255,255,255,0.05)',
    tooltipBg: '#18181b', // Zn-900 hardcoded for tooltip
  };

  // Status Colors (Matching the dark aesthetic)
  const STATUS_COLORS = {
    pending: '#fbbf24',    // Amber
    paid: '#34d399',       // Emerald
    shipped: '#60a5fa',    // Blue
    delivered: '#d4af37',  // Gold (Success)
    cancelled: '#ef4444',  // Red
  };

  const pieData = statusData.map(item => ({
    name: item.status.toUpperCase(),
    value: item.count,
    color: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || '#71717a'
  })).filter(item => item.value > 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '40px' }}>
      
      {/* Sales Trend */}
      <div style={{ 
          background: THEME.background, 
          backdropFilter: 'blur(10px)',
          padding: '32px', 
          borderRadius: 'var(--radius)', 
          border: `1px solid ${THEME.border}` 
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '32px', color: 'var(--text-on-dark)', textTransform: 'uppercase', letterSpacing: '1px' }}>Sales Trend (30 Days)</h3>
        <div style={{ height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.grid} />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 11, fill: '#71717a'}} 
                tickFormatter={(val) => new Date(val).getDate().toString()}
                stroke="transparent"
                dy={10}
              />
              <YAxis 
                yAxisId="left"
                tick={{fontSize: 11, fill: '#71717a'}}
                stroke="transparent"
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{fontSize: 11, fill: '#71717a'}}
                stroke="transparent"
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip 
                contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid var(--border)', 
                    backgroundColor: THEME.tooltipBg, 
                    color: '#fff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }}
                labelStyle={{ color: '#a1a1aa' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }}/>
              <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#60a5fa" name="Orders" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#d4af37" name="Revenue" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Distribution */}
      <div style={{ 
          background: THEME.background, 
          backdropFilter: 'blur(10px)',
          padding: '32px', 
          borderRadius: 'var(--radius)', 
          border: `1px solid ${THEME.border}` 
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '32px', color: 'var(--text-on-dark)', textTransform: 'uppercase', letterSpacing: '1px' }}>Order Statuses</h3>
        <div style={{ height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid var(--border)', 
                    backgroundColor: THEME.tooltipBg, 
                    color: '#fff'
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle"/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
