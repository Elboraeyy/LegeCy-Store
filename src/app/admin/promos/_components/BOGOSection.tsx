'use client';

import { BOGOWithStats } from '@/lib/actions/promotions';
import '@/app/admin/admin.css';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

interface BOGOSectionProps {
    deals: BOGOWithStats[];
    onCreate: () => void;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}

export default function BOGOSection({
    deals,
    onCreate,
    onToggle,
    onDelete
}: BOGOSectionProps) {
    // Helper to format deal description (to be localized later)
    const getDealDescription = (deal: BOGOWithStats) => {
        const buy = `Buy ${deal.buyQuantity}`;
        const get = `Get ${deal.getQuantity}`;
        const discount = deal.discountPercent === 100
            ? 'Free'
            : `${deal.discountPercent}% Off`;
        return `${buy}, ${get} ${discount}`;
    };



    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const tp = t.promos;
    const tb = tp.bogo;

    return (
        <div className="promo-section">
            <div className="section-header">
                <h2>🎁 {tb.title}</h2>
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

            {deals.length === 0 ? (
                <div className="admin-card promo-feature-card">
                    {/* Feature Grid */}
                    <div className="feature-grid">
                        <div className="feature-item">
                            <div className="feature-icon">🆓</div>
                            <div className="feature-content">
                                <h3>{tb.features.free}</h3>
                                <p>{tb.features.free_desc}</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">💰</div>
                            <div className="feature-content">
                                <h3>{tb.features.discount}</h3>
                                <p>{tb.features.discount_desc}</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🔀</div>
                            <div className="feature-content">
                                <h3>{tb.features.mix}</h3>
                                <p>{tb.features.mix_desc}</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">📦</div>
                            <div className="feature-content">
                                <h3>{tb.features.tiers}</h3>
                                <p>{tb.features.tiers_desc}</p>
                            </div>
                        </div>
                    </div>

                    <div className="promo-empty-state">
                        <div className="empty-icon">🎁</div>
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
                                    <th>{tb.type}</th>
                                    <th>{tb.config}</th>
                                    <th>{tb.dates}</th>
                                    <th>{tb.usage}</th>
                                    <th>{t.common.status || 'Status'}</th>
                                    <th>{t.common.actions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deals.map(deal => (
                                    <tr key={deal.id}>
                                        <td>
                                            <div className="fw-500">{deal.name}</div>
                                            {deal.description && <div className="text-muted text-sm">{deal.description}</div>}
                                        </td>
                                        <td>
                                            <span className="badge badge-blue">
                                                {deal.dealType === 'BUY_X_GET_Y_FREE' ? tb.free_gift : tb.discounted_item}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="fw-600 text-primary">
                                                {getDealDescription(deal)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                <div>Starts: {new Date(deal.startDate).toLocaleDateString()}</div>
                                                {deal.endDate && <div>Ends: {new Date(deal.endDate).toLocaleDateString()}</div>}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-center">
                                                <div className="fw-500">{deal.currentUsage}</div>
                                                <div className="text-xs text-muted">{tb.uses}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${deal.status}`}>
                                                {deal.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="coupon-actions">
                                                <button
                                                    className="action-btn"
                                                    title={deal.isActive ? 'Deactivate' : 'Activate'}
                                                    onClick={() => onToggle(deal.id)}
                                                >
                                                    {deal.isActive ? '🚫' : '✅'}
                                                </button>
                                                <button
                                                    className="action-btn"
                                                    title="Delete"
                                                    onClick={() => onDelete(deal.id)}
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
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
                .badge-blue { background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; }
            `}</style>
        </div>
    );
}
