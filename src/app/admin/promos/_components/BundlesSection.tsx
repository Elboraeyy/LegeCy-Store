'use client';

import { BundleWithStats } from '@/lib/actions/promotions';
import '@/app/admin/admin.css';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

interface BundlesSectionProps {
    bundles: BundleWithStats[];
    onCreate: () => void;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}

export default function BundlesSection({
    bundles,
    onCreate,
    onToggle,
    onDelete
}: BundlesSectionProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const tp = t.promos;
    const tb = tp.bundles;

    return (
        <div className="promo-section">
            <div className="section-header">
                <h2>📦 {tb.title}</h2>
                <div className="section-actions">
                    <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={onCreate}
                    >
                        <span>+</span> {tb.create}
                    </button>
                </div>
            </div>

            {bundles.length === 0 ? (
                <div className="admin-card promo-feature-card">
                    <div className="feature-grid">
                        <div className="feature-item">
                            <div className="feature-icon">🛒</div>
                            <div className="feature-content">
                                <h3>{tb.features.bundles}</h3>
                                <p>{tb.features.bundles_desc}</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">👔</div>
                            <div className="feature-content">
                                <h3>{tb.features.look}</h3>
                                <p>{tb.features.look_desc}</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">📈</div>
                            <div className="feature-content">
                                <h3>{tb.features.tiered}</h3>
                                <p>{tb.features.tiered_desc}</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🎯</div>
                            <div className="feature-content">
                                <h3>{tb.features.custom}</h3>
                                <p>{tb.features.custom_desc}</p>
                            </div>
                        </div>
                    </div>

                    <div className="promo-empty-state">
                        <div className="empty-icon">📦</div>
                        <h3>{tb.empty}</h3>
                        <p>{tb.empty_desc}</p>
                        <button className="admin-btn admin-btn-primary" onClick={onCreate}>{tb.create}</button>
                    </div>
                </div>
            ) : (
                <div className="admin-card">
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>{tb.name}</th>
                                    <th>{tb.price}</th>
                                    <th>{tb.duration}</th>
                                    <th>{tb.products}</th>
                                    <th>{tb.sales}</th>
                                    <th>{t.common.status || 'Status'}</th>
                                    <th>{t.common.actions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bundles.map(bundle => (
                                    <tr key={bundle.id}>
                                        <td>
                                            <div className="fw-500">{bundle.name}</div>
                                            {bundle.description && <div className="text-muted text-sm">{bundle.description}</div>}
                                        </td>
                                        <td>
                                            <div className="fw-600 text-primary">
                                                EGP {bundle.bundlePrice.toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                <div>Starts: {new Date(bundle.startDate).toLocaleDateString()}</div>
                                                {bundle.endDate && <div>Ends: {new Date(bundle.endDate).toLocaleDateString()}</div>}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-center">
                                                <div className="fw-500">{bundle.productCount}</div>
                                                <div className="text-xs text-muted">{t.promos.flash_sales.items}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="fw-500">EGP {bundle.revenue.toLocaleString()}</div>
                                            <div className="text-xs text-muted">{bundle.soldCount} {t.promos.flash_sales.sold}</div>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${bundle.status}`}>
                                                {bundle.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="coupon-actions">
                                                <button
                                                    className="action-btn"
                                                    title={bundle.isActive ? 'Deactivate' : 'Activate'}
                                                    onClick={() => onToggle(bundle.id)}
                                                >
                                                    {bundle.isActive ? '🚫' : '✅'}
                                                </button>
                                                <button
                                                    className="action-btn"
                                                    title="Delete"
                                                    onClick={() => onDelete(bundle.id)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <style jsx>{`
                .promo-section { margin-top: 24px; }
                .promo-feature-card { padding: 32px; margin-bottom: 24px; }
                .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; }
                .feature-item { display: flex; gap: 16px; }
                .feature-icon { font-size: 32px; flex-shrink: 0; }
                .feature-content h3 { font-size: 16px; font-weight: 600; margin: 0 0 4px; }
                .feature-content p { font-size: 13px; color: var(--admin-text-muted); margin: 0; }
                .promo-empty-state { text-align: center; padding: 60px 24px; background: #f9f9f9; border-radius: 16px; margin-top: 24px; }
                .empty-icon { font-size: 48px; margin-bottom: 16px; }
                .promo-empty-state h3 { font-size: 18px; margin-bottom: 8px; }
                .promo-empty-state p { color: var(--admin-text-muted); margin-bottom: 24px; }
            `}</style>
        </div>
    );
}
