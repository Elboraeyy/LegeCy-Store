'use client';

import '@/app/admin/admin.css';
import { useEffect, useState } from 'react';
import { getReturnsIntelligence, ReturnStats } from '@/lib/services/operationsService';
import Link from 'next/link';

export default function ReturnsIntelligencePage() {
    const [data, setData] = useState<ReturnStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            try {
                const result = await getReturnsIntelligence();
                if (!cancelled) setData(result);
            } catch (error) {
                console.error('Failed to load returns intelligence:', error);
            }
            if (!cancelled) setLoading(false);
        })();

        return () => { cancelled = true; };
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-EG', {
            style: 'currency',
            currency: 'EGP',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="returns-intelligence-loading">
                <div className="spinner"></div>
                <p>Loading analytics...</p>
                <style jsx>{`
                    .returns-intelligence-loading {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 400px;
                    }
                    .spinner {
                        width: 40px;
                        height: 40px;
                        border: 3px solid #f3f3f3;
                        border-top: 3px solid var(--admin-bg-dark);
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin-bottom: 16px;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="returns-intelligence-empty">
                <div className="empty-icon">📊</div>
                <h3>No Data Available</h3>
                <p>Not enough return data to generate analytics</p>
                <Link href="/admin/orders/returns" className="admin-btn admin-btn-primary" style={{ marginTop: '16px' }}>
                    View Returns
                </Link>
                <style jsx>{`
                    .returns-intelligence-empty {
                        text-align: center;
                        padding: 80px 24px;
                    }
                    .empty-icon {
                        font-size: 64px;
                        margin-bottom: 16px;
                    }
                    h3 {
                        font-size: 20px;
                        margin-bottom: 8px;
                    }
                    p {
                        color: var(--admin-text-muted);
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="returns-intelligence-page">
            {/* Header */}
            <div className="intelligence-header">
                <div>
                    <h1 className="admin-title">Returns Intelligence</h1>
                    <p className="admin-subtitle">Analytics and recommendations for return optimization</p>
                </div>
                <Link href="/admin/orders/returns" className="admin-btn admin-btn-outline">
                    ← Back to Returns
                </Link>
            </div>

            {/* Key Metrics */}
            <div className="metrics-grid">
                <MetricCard
                    icon="📦"
                    label="Total Returns"
                    value={data.totalReturns.toString()}
                    subtext="Last 30 days"
                    color="#ef4444"
                />
                <MetricCard
                    icon="📊"
                    label="Return Rate"
                    value={`${data.returnRate.toFixed(1)}%`}
                    subtext={data.returnRate > 10 ? 'Above average' : 'Within normal range'}
                    color={data.returnRate > 10 ? '#ef4444' : '#10b981'}
                />
                <MetricCard
                    icon="💸"
                    label="Return Cost"
                    value={formatCurrency(data.totalCost)}
                    subtext="Direct loss"
                    color="#f59e0b"
                />
                <MetricCard
                    icon="📈"
                    label="Top Reason"
                    value={data.topReasons[0]?.reason.slice(0, 15) || 'N/A'}
                    subtext={`${data.topReasons[0]?.count || 0} occurrences`}
                    color="#3b82f6"
                />
            </div>

            {/* Smart Suggestions */}
            {data.suggestions.length > 0 && (
                <div className="admin-card suggestions-card">
                    <h3 className="card-title">
                        <span>💡</span> Smart Recommendations
                    </h3>
                    <ul className="suggestions-list">
                        {data.suggestions.map((suggestion, idx) => (
                            <li key={idx}>
                                <span className="bullet">•</span>
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Two Column Layout */}
            <div className="two-column-grid">
                {/* Top Return Reasons */}
                <div className="admin-card">
                    <h3 className="card-title">
                        <span>📋</span> Return Reasons
                    </h3>
                    {data.topReasons.length > 0 ? (
                        <div className="reasons-list">
                            {data.topReasons.map((reason, idx) => (
                                <div key={idx} className="reason-item">
                                    <div className="reason-header">
                                        <span className="reason-name">{reason.reason}</span>
                                        <span className="reason-count">{reason.count}</span>
                                    </div>
                                    <div className="reason-bar">
                                        <div
                                            className="reason-bar-fill"
                                            style={{ width: `${(reason.count / data.totalReturns) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-data">No data available</p>
                    )}
                </div>

                {/* By Region */}
                <div className="admin-card">
                    <h3 className="card-title">
                        <span>🗺️</span> Returns by Region
                    </h3>
                    {data.byRegion.length > 0 ? (
                        <table className="region-table">
                            <thead>
                                <tr>
                                    <th>City</th>
                                    <th>Count</th>
                                    <th>Rate</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.byRegion.slice(0, 5).map((region, idx) => (
                                    <tr key={idx}>
                                        <td className="region-city">{region.city}</td>
                                        <td className="region-count">{region.returnCount}</td>
                                        <td className="region-rate">{region.returnRate.toFixed(1)}%</td>
                                        <td>
                                            <span className={`region-status ${
                                                region.returnRate >= 20 ? 'danger' :
                                                region.returnRate >= 10 ? 'warning' : 'normal'
                                            }`}>
                                                {region.returnRate >= 20 ? 'Critical' :
                                                 region.returnRate >= 10 ? 'Warning' : 'Normal'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="no-data">No data available</p>
                    )}
                </div>
            </div>

            {/* Products with High Returns */}
            <div className="admin-card">
                <h3 className="card-title">
                    <span>📦</span> Products with Highest Returns
                </h3>
                {data.byProduct.length > 0 ? (
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Returns</th>
                                <th>Rate</th>
                                <th>Cost</th>
                                <th>Recommendation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.byProduct.map((product, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <div className="product-name">{product.productName}</div>
                                        <div className="product-id">{product.productId.slice(0, 8)}</div>
                                    </td>
                                    <td>{product.returnCount}</td>
                                    <td>
                                        <span className={`rate-badge ${
                                            product.returnRate >= 20 ? 'danger' :
                                            product.returnRate >= 10 ? 'warning' : 'normal'
                                        }`}>
                                            {product.returnRate.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="product-cost">{formatCurrency(product.totalCost)}</td>
                                    <td>
                                        {product.returnRate >= 25 ? (
                                            <span className="recommendation danger">⛔ Discontinue</span>
                                        ) : product.returnRate >= 15 ? (
                                            <span className="recommendation warning">⚠️ Review Quality</span>
                                        ) : (
                                            <span className="recommendation normal">✅ Normal</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-data">No return data available</p>
                )}
            </div>

            <style jsx>{`
                .returns-intelligence-page {
                    padding: 0;
                }

                .intelligence-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 32px;
                }

                .suggestions-card {
                    background: linear-gradient(135deg, #fef3c7, #fde68a);
                    border: 1px solid #f59e0b;
                    margin-bottom: 32px;
                }

                .card-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 16px;
                    color: var(--admin-text-on-light);
                }

                .suggestions-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .suggestions-list li {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    padding: 8px 0;
                    color: #92400e;
                }

                .bullet {
                    font-weight: bold;
                }

                .two-column-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 24px;
                    margin-bottom: 32px;
                }

                .reasons-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .reason-item {
                    padding: 8px 0;
                }

                .reason-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 6px;
                }

                .reason-name {
                    font-size: 14px;
                    font-weight: 500;
                }

                .reason-count {
                    font-size: 14px;
                    color: var(--admin-text-muted);
                }

                .reason-bar {
                    height: 8px;
                    background: #f3f4f6;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .reason-bar-fill {
                    height: 100%;
                    background: #ef4444;
                    border-radius: 4px;
                }

                .region-table, .products-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .region-table th, .products-table th {
                    text-align: left;
                    padding: 12px 8px;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--admin-text-muted);
                    border-bottom: 1px solid #eee;
                }

                .region-table td, .products-table td {
                    padding: 12px 8px;
                    border-bottom: 1px solid #f5f5f5;
                }

                .region-city, .product-name {
                    font-weight: 500;
                }

                .product-id {
                    font-size: 11px;
                    color: var(--admin-text-muted);
                    font-family: monospace;
                }

                .region-status, .rate-badge {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 500;
                }

                .region-status.normal, .rate-badge.normal {
                    background: #d1fae5;
                    color: #065f46;
                }

                .region-status.warning, .rate-badge.warning {
                    background: #fef3c7;
                    color: #92400e;
                }

                .region-status.danger, .rate-badge.danger {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .product-cost {
                    color: #dc2626;
                    font-weight: 500;
                }

                .recommendation {
                    font-size: 12px;
                }

                .recommendation.danger { color: #dc2626; }
                .recommendation.warning { color: #d97706; }
                .recommendation.normal { color: #059669; }

                .no-data {
                    text-align: center;
                    color: var(--admin-text-muted);
                    padding: 32px;
                }

                @media (max-width: 768px) {
                    .two-column-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}

function MetricCard({
    icon,
    label,
    value,
    subtext,
    color
}: {
    icon: string;
    label: string;
    value: string;
    subtext: string;
    color: string;
}) {
    return (
        <div className="admin-card metric-card">
            <div className="metric-icon">{icon}</div>
            <div className="metric-content">
                <div className="metric-label">{label}</div>
                <div className="metric-value" style={{ color }}>{value}</div>
                <div className="metric-subtext">{subtext}</div>
            </div>
            <style jsx>{`
                .metric-card {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    padding: 20px;
                }
                .metric-icon {
                    font-size: 28px;
                }
                .metric-content {
                    flex: 1;
                }
                .metric-label {
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--admin-text-muted);
                }
                .metric-value {
                    font-size: 24px;
                    font-weight: 600;
                    margin: 4px 0;
                }
                .metric-subtext {
                    font-size: 12px;
                    color: var(--admin-text-muted);
                }
            `}</style>
        </div>
    );
}
