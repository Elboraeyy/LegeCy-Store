"use client";

import { formatCurrency } from "@/lib/utils";

import { DashboardStats } from "../../dashboard-actions";

export function TopProducts({ products }: { products: DashboardStats['lists']['topProducts'] }) {
    return (
        <div className="admin-card">
            <div className="stat-label" style={{ marginBottom: '20px' }}>Top Products</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                        <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '12px', color: 'var(--admin-text-muted)' }}>Product</th>
                        <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '12px', color: 'var(--admin-text-muted)' }}>Sold</th>
                        <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '12px', color: 'var(--admin-text-muted)' }}>Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: 500 }}>
                                {product.name}
                            </td>
                            <td style={{ padding: '12px 0', textAlign: 'right', fontSize: '13px' }}>
                                {product.quantity}
                            </td>
                            <td style={{ padding: '12px 0', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>
                                {formatCurrency(product.revenue)}
                            </td>
                        </tr>
                    ))}
                    {products.length === 0 && (
                        <tr><td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No sales yet</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
