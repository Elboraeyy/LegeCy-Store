'use client';

import { FlashSaleWithStats } from '@/lib/actions/promotions';
import '@/app/admin/admin.css';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

interface FlashSalesSectionProps {
    flashSales: FlashSaleWithStats[];
    onCreate: () => void;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}

export default function FlashSalesSection({
    flashSales,
    onCreate,
    onToggle,
    onDelete
}: FlashSalesSectionProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const tp = t.promos;
    const tf = tp.flash_sales;

    // Helper function for currency formatting (will be replaced by localization later)
    const formatCurrency = (value: number) => `EGP ${value.toLocaleString()}`;

    return (
        <div className="promo-section">
            <div className="section-header">
                <h2>⚡ {tf.title}</h2>
                <div className="section-actions">
                    <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={onCreate}
                    >
                        <span>+</span> {tf.create}
                    </button>
                </div>
            </div>

            {flashSales.length === 0 ? (
                <>
                    <div className="admin-card promo-feature-card">
                        {/* Feature Grid */}
                        <div className="feature-grid">
                            <div className="feature-item">
                                <div className="feature-icon">⏰</div>
                                <div className="feature-content">
                                    <h3>{tf.features.time}</h3>
                                    <p>{tf.features.time_desc}</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">📊</div>
                                <div className="feature-content">
                                    <h3>{tf.features.quantity}</h3>
                                    <p>{tf.features.quantity_desc}</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🏷️</div>
                                <div className="feature-content">
                                    <h3>{tf.features.discount}</h3>
                                    <p>{tf.features.discount_desc}</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">📱</div>
                                <div className="feature-content">
                                    <h3>{tf.features.banner}</h3>
                                    <p>{tf.features.banner_desc}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="promo-empty-state">
                        <div className="empty-icon">⚡</div>
                        <h3>{tf.empty}</h3>
                        <p>{tf.empty_desc}</p>
                        <button className="admin-btn admin-btn-primary" onClick={onCreate}>{tf.create}</button>
                    </div>
                </>
            ) : (
                <div className="admin-card">
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>{tf.name}</th>
                                    <th>{tf.status || 'Status'}</th>
                                    <th>{tf.discount}</th>
                                    <th>{tf.duration}</th>
                                    <th>{tf.products}</th>
                                    <th>{tf.revenue}</th>
                                    <th>{t.common?.actions || 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flashSales.map(sale => (
                                    <tr key={sale.id}>
                                        <td>
                                            <div className="fw-500">{sale.name}</div>
                                            {sale.description && <div className="text-muted text-sm">{sale.description}</div>}
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${sale.status}`}>
                                                {sale.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="fw-600">
                                                {sale.discountType === 'PERCENTAGE'
                                                    ? `${sale.discountValue}% OFF`
                                                    : `- ${formatCurrency(sale.discountValue)}`}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                <div>From: {new Date(sale.startDate).toLocaleDateString()}</div>
                                                <div>To: {new Date(sale.endDate).toLocaleDateString()}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-center">
                                                <div className="fw-500">{sale.productCount}</div>
                                                <div className="text-xs text-muted">{tf.items}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="fw-500">{formatCurrency(sale.revenue)}</div>
                                            <div className="text-xs text-muted">{sale.soldCount} {tf.sold}</div>
                                        </td>
                                        <td>
                                            <div className="coupon-actions">
                                                <button
                                                    className="action-btn"
                                                    title={sale.isActive ? 'Deactivate' : 'Activate'}
                                                    onClick={() => onToggle(sale.id)}
                                                >
                                                    {sale.isActive ? '🚫' : '✅'}
                                                </button>
                                                <button
                                                    className="action-btn"
                                                    title="Delete"
                                                    onClick={() => onDelete(sale.id)}
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
                .promo-empty-state { text-align: center; padding: 60px 24px; background: #f9f9f9; border-radius: 16px; }
                .empty-icon { font-size: 48px; margin-bottom: 16px; }
                .promo-empty-state h3 { font-size: 18px; margin-bottom: 8px; }
                .promo-empty-state p { color: var(--admin-text-muted); margin-bottom: 24px; }
            `}</style>
        </div>
    );
}
