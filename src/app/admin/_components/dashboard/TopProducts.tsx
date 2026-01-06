"use client";

import { formatCurrency } from "@/lib/utils";

import { DashboardStats } from "../../dashboard-actions";

export function TopProducts({ products }: { products: DashboardStats['lists']['topProducts'] }) {
    return (
        <div className="admin-card">
            <div className="stat-label" style={{ marginBottom: '20px' }}>Top Products</div>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th style={{ textAlign: 'right' }}>Sold</th>
                            <th style={{ textAlign: 'right' }}>Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product, idx) => (
                            <tr key={idx}>
                                <td style={{ fontWeight: 500 }}>
                                    {product.name}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    {product.quantity}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>
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
        </div>
    );
}
