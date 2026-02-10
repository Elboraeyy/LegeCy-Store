'use client';

import { ProductOfferWithStats } from '@/lib/actions/promotions';
import '@/app/admin/admin.css';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

interface ProductOffersSectionProps {
    offers: ProductOfferWithStats[];
    onCreate: () => void;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}

export default function ProductOffersSection({
    offers,
    onCreate,
    onToggle,
    onDelete
}: ProductOffersSectionProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const tp = t.promos;
    const to = tp.offers;

    return (
        <div className="promo-section">
            <div className="section-header">
                <h2>🏷️ {to.title}</h2>
                <div className="section-actions">
                    <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={onCreate}
                    >
                        <span>+</span> {to.create}
                    </button>
                </div>
            </div>

            {offers.length === 0 ? (
                <div className="admin-card promo-feature-card">
                    <div className="feature-grid">
                        <div className="feature-item">
                            <div className="feature-icon">🛍️</div>
                            <div className="feature-content">
                                <h3>{to.features.product}</h3>
                                <p>{to.features.product_desc}</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">📂</div>
                            <div className="feature-content">
                                <h3>{to.features.category}</h3>
                                <p>{to.features.category_desc}</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🏢</div>
                            <div className="feature-content">
                                <h3>{to.features.brand}</h3>
                                <p>{to.features.brand_desc}</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🌐</div>
                            <div className="feature-content">
                                <h3>{to.features.store}</h3>
                                <p>{to.features.store_desc}</p>
                            </div>
                        </div>
                    </div>

                    <div className="promo-empty-state">
                        <div className="empty-icon">🏷️</div>
                        <h3>{to.empty}</h3>
                        <p>{to.empty_desc}</p>
                        <button className="admin-btn admin-btn-primary" onClick={onCreate}>{to.create}</button>
                    </div>
                </div>
            ) : (
                <div className="admin-card">
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>{to.name}</th>
                                    <th>{to.target}</th>
                                    <th>{to.discount}</th>
                                    <th>{to.duration}</th>
                                    <th>{t.common.status || 'Status'}</th>
                                    <th>{t.common.actions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {offers.map(offer => (
                                    <tr key={offer.id}>
                                        <td>
                                            <div className="fw-500">{offer.name}</div>
                                            {offer.description && <div className="text-muted text-sm">{offer.description}</div>}
                                            <div className="text-xs text-muted">Priority: {offer.priority}</div>
                                        </td>
                                        <td>
                                            <div className="badge badge-neutral">
                                                {offer.offerType === 'ALL_PRODUCTS' ? 'Storewide' : offer.offerType}
                                            </div>
                                            {offer.targetName && offer.offerType !== 'ALL_PRODUCTS' && (
                                                <div className="mt-1 fw-500 text-sm">{offer.targetName}</div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="fw-600 text-primary">
                                                {offer.discountType === 'PERCENTAGE'
                                                    ? `${offer.discountValue}% OFF`
                                                    : `EGP ${offer.discountValue.toLocaleString()} OFF`
                                                }
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                <div>Starts: {new Date(offer.startDate).toLocaleDateString()}</div>
                                                {offer.endDate && <div>Ends: {new Date(offer.endDate).toLocaleDateString()}</div>}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${offer.status}`}>
                                                {offer.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="coupon-actions">
                                                <button
                                                    className="action-btn"
                                                    title={offer.isActive ? 'Deactivate' : 'Activate'}
                                                    onClick={() => onToggle(offer.id)}
                                                >
                                                    {offer.isActive ? '🚫' : '✅'}
                                                </button>
                                                <button
                                                    className="action-btn"
                                                    title="Delete"
                                                    onClick={() => onDelete(offer.id)}
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
