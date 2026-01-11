'use client';

import '@/app/admin/admin.css';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
    getCoupons, 
    getCouponAnalytics, 
    createCoupon, 
    updateCoupon, 
    deleteCoupon, 
    toggleCouponStatus, 
    duplicateCoupon,
    bulkCreateCoupons,
    CouponWithStats, 
    CouponAnalytics, 
    CouponFilters,
    CouponInput
} from '@/lib/actions/coupons';

// ==========================================
// Types
// ==========================================

type TabType = 'all' | 'active' | 'scheduled' | 'expired' | 'inactive';
type ModalType = 'create' | 'edit' | 'bulk' | null;

// ==========================================
// Main Page Component
// ==========================================

export default function PromosPage() {
    // State
    const [coupons, setCoupons] = useState<CouponWithStats[]>([]);
    const [analytics, setAnalytics] = useState<CouponAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [modalType, setModalType] = useState<ModalType>(null);
    const [editingCoupon, setEditingCoupon] = useState<CouponWithStats | null>(null);
    const [selectedCoupons, setSelectedCoupons] = useState<Set<string>>(new Set());

    // Load Data
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const filters: CouponFilters = {
                search: search || undefined,
                status: activeTab === 'all' ? undefined : activeTab,
                page,
                limit: 20
            };

            const [couponsData, analyticsData] = await Promise.all([
                getCoupons(filters),
                getCouponAnalytics()
            ]);

            setCoupons(couponsData.coupons);
            setTotalPages(couponsData.totalPages);
            setAnalytics(analyticsData);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    }, [search, activeTab, page]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handlers
    const handleToggleStatus = async (id: string) => {
        const result = await toggleCouponStatus(id);
        if (result.success) {
            toast.success(`Coupon ${result.isActive ? 'activated' : 'deactivated'}`);
            loadData();
        } else {
            toast.error(result.error || 'Failed to toggle status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this coupon?')) return;
        
        const result = await deleteCoupon(id);
        if (result.success) {
            toast.success('Coupon deactivated');
            loadData();
        } else {
            toast.error(result.error || 'Failed to delete coupon');
        }
    };

    const handleDuplicate = async (id: string) => {
        const result = await duplicateCoupon(id);
        if (result.success) {
            toast.success(`Created duplicate: ${result.coupon?.code}`);
            loadData();
        } else {
            toast.error(result.error || 'Failed to duplicate coupon');
        }
    };

    const handleEdit = (coupon: CouponWithStats) => {
        setEditingCoupon(coupon);
        setModalType('edit');
    };

    const handleSaveCoupon = async (data: CouponInput) => {
        if (editingCoupon) {
            const result = await updateCoupon(editingCoupon.id, data);
            if (result.success) {
                toast.success('Coupon updated');
                setModalType(null);
                setEditingCoupon(null);
                loadData();
            } else {
                toast.error(result.error || 'Failed to update coupon');
            }
        } else {
            const result = await createCoupon(data);
            if (result.success) {
                toast.success('Coupon created');
                setModalType(null);
                loadData();
            } else {
                toast.error(result.error || 'Failed to create coupon');
            }
        }
    };

    const handleBulkCreate = async (params: Parameters<typeof bulkCreateCoupons>[0]) => {
        const result = await bulkCreateCoupons(params);
        if (result.success) {
            toast.success(`Created ${result.count} coupons`);
            setModalType(null);
            loadData();
        } else {
            toast.error(result.error || 'Failed to create coupons');
        }
    };

    const toggleSelectCoupon = (id: string) => {
        setSelectedCoupons(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleBulkToggle = async (activate: boolean) => {
        for (const id of selectedCoupons) {
            const coupon = coupons.find(c => c.id === id);
            if (coupon && coupon.isActive !== activate) {
                await toggleCouponStatus(id);
            }
        }
        setSelectedCoupons(new Set());
        toast.success(`${selectedCoupons.size} coupons updated`);
        loadData();
    };

    // Format helpers
    const formatCurrency = (value: number) => `EGP ${value.toLocaleString()}`;
    const formatDate = (date: Date | null) => date ? new Date(date).toLocaleDateString('en-EG', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'all', label: 'All Coupons', icon: '🎫' },
        { id: 'active', label: 'Active', icon: '✅' },
        { id: 'scheduled', label: 'Scheduled', icon: '📅' },
        { id: 'expired', label: 'Expired', icon: '⏰' },
        { id: 'inactive', label: 'Inactive', icon: '🚫' },
    ];

    return (
        <div className="admin-promos-page">
            {/* Header */}
            <div className="promos-header">
                <div>
                    <h1 className="admin-title">Promos & Discounts</h1>
                    <p className="admin-subtitle">Manage coupon codes, flash sales, and promotional campaigns</p>
                </div>
                <div className="promos-header-actions">
                    <button 
                        type="button"
                        className="admin-btn admin-btn-outline"
                        onClick={() => setModalType('bulk')}
                    >
                        <span>⚡</span> Bulk Create
                    </button>
                    <button 
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={() => { setEditingCoupon(null); setModalType('create'); }}
                    >
                        <span>+</span> New Coupon
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {analytics && (
                <div className="promos-stats-grid">
                    <div className="admin-card promos-stat-card">
                        <div className="stat-icon">🎫</div>
                        <div className="stat-content">
                            <div className="stat-label">Total Coupons</div>
                            <div className="stat-value">{analytics.totalCoupons}</div>
                            <div className="stat-meta">{analytics.activeCoupons} active</div>
                        </div>
                    </div>
                    <div className="admin-card promos-stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <div className="stat-label">Total Usage</div>
                            <div className="stat-value">{analytics.totalUsage}</div>
                            <div className="stat-meta">times used</div>
                        </div>
                    </div>
                    <div className="admin-card promos-stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <div className="stat-label">Discounts Given</div>
                            <div className="stat-value">{formatCurrency(analytics.totalDiscountGiven)}</div>
                            <div className="stat-meta">total savings for customers</div>
                        </div>
                    </div>
                    <div className="admin-card promos-stat-card">
                        <div className="stat-icon">📈</div>
                        <div className="stat-content">
                            <div className="stat-label">Coupon Conversion</div>
                            <div className="stat-value">{analytics.conversionRate.toFixed(1)}%</div>
                            <div className="stat-meta">{analytics.ordersWithCoupons} orders with coupons</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="promos-tabs-container">
                <div className="admin-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`admin-tab-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => { setActiveTab(tab.id); setPage(1); }}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
                <div className="promos-search">
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by code..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedCoupons.size > 0 && (
                <div className="promos-bulk-actions">
                    <span>{selectedCoupons.size} selected</span>
                    <button className="admin-btn admin-btn-outline" onClick={() => handleBulkToggle(true)}>Activate All</button>
                    <button className="admin-btn admin-btn-outline" onClick={() => handleBulkToggle(false)}>Deactivate All</button>
                    <button className="admin-btn admin-btn-outline" onClick={() => setSelectedCoupons(new Set())}>Clear</button>
                </div>
            )}

            {/* Coupons Table */}
            <div className="admin-table-container">
                {loading ? (
                    <div className="promos-loading">
                        <div className="skeleton" style={{ height: '400px' }} />
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="promos-empty">
                        <div className="promos-empty-icon">🎫</div>
                        <h3>No Coupons Found</h3>
                        <p>Create your first coupon to boost sales</p>
                        <button 
                            className="admin-btn admin-btn-primary"
                            onClick={() => { setEditingCoupon(null); setModalType('create'); }}
                        >
                            Create Coupon
                        </button>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input 
                                        type="checkbox"
                                        checked={selectedCoupons.size === coupons.length && coupons.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedCoupons(new Set(coupons.map(c => c.id)));
                                            } else {
                                                setSelectedCoupons(new Set());
                                            }
                                        }}
                                    />
                                </th>
                                <th>Code</th>
                                <th>Type</th>
                                <th>Value</th>
                                <th>Usage</th>
                                <th>Valid Period</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.map(coupon => (
                                <tr key={coupon.id}>
                                    <td>
                                        <input 
                                            type="checkbox"
                                            checked={selectedCoupons.has(coupon.id)}
                                            onChange={() => toggleSelectCoupon(coupon.id)}
                                        />
                                    </td>
                                    <td>
                                        <span className="coupon-code">{coupon.code}</span>
                                    </td>
                                    <td>
                                        <span className={`coupon-type coupon-type-${coupon.discountType.toLowerCase()}`}>
                                            {coupon.discountType === 'PERCENTAGE' ? '📊 Percentage' : '💵 Fixed'}
                                        </span>
                                    </td>
                                    <td>
                                        <strong>
                                            {coupon.discountType === 'PERCENTAGE' 
                                                ? `${coupon.discountValue}%` 
                                                : formatCurrency(coupon.discountValue)
                                            }
                                        </strong>
                                        {coupon.minOrderValue && (
                                            <div className="coupon-meta">Min: {formatCurrency(coupon.minOrderValue)}</div>
                                        )}
                                        {coupon.maxDiscount && (
                                            <div className="coupon-meta">Max: {formatCurrency(coupon.maxDiscount)}</div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="coupon-usage">
                                            <span className="usage-current">{coupon.currentUsage}</span>
                                            {coupon.usageLimit && (
                                                <span className="usage-limit">/ {coupon.usageLimit}</span>
                                            )}
                                        </div>
                                        {coupon.totalDiscount !== undefined && coupon.totalDiscount > 0 && (
                                            <div className="coupon-meta">{formatCurrency(coupon.totalDiscount)} saved</div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="coupon-dates">
                                            <div>{formatDate(coupon.startDate)}</div>
                                            {coupon.endDate && (
                                                <div className="coupon-meta">to {formatDate(coupon.endDate)}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${coupon.status}`}>
                                            {coupon.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="coupon-actions">
                                            <button 
                                                type="button"
                                                className="action-btn" 
                                                onClick={() => handleEdit(coupon)}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                type="button"
                                                className="action-btn" 
                                                onClick={() => handleDuplicate(coupon.id)}
                                                title="Duplicate"
                                            >
                                                📋
                                            </button>
                                            <div 
                                                className="toggle-switch"
                                                style={{
                                                    position: 'relative',
                                                    width: '44px',
                                                    height: '24px',
                                                    background: coupon.isActive ? '#12403C' : '#ccc',
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.3s ease'
                                                }}
                                                onClick={() => handleToggleStatus(coupon.id)}
                                                title={coupon.isActive ? 'Click to deactivate' : 'Click to activate'}
                                            >
                                                <div 
                                                    style={{
                                                        position: 'absolute',
                                                        top: '2px',
                                                        left: coupon.isActive ? '22px' : '2px',
                                                        width: '20px',
                                                        height: '20px',
                                                        background: '#fff',
                                                        borderRadius: '50%',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                        transition: 'left 0.3s ease'
                                                    }}
                                                />
                                            </div>
                                            <button 
                                                type="button"
                                                className="action-btn action-btn-danger" 
                                                onClick={() => handleDelete(coupon.id)}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="promos-pagination">
                    <button 
                        className="admin-btn admin-btn-outline"
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        ← Previous
                    </button>
                    <span>Page {page} of {totalPages}</span>
                    <button 
                        className="admin-btn admin-btn-outline"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Create/Edit Modal */}
            {(modalType === 'create' || modalType === 'edit') && (
                <CouponModal
                    coupon={editingCoupon}
                    onSave={handleSaveCoupon}
                    onClose={() => { setModalType(null); setEditingCoupon(null); }}
                />
            )}

            {/* Bulk Create Modal */}
            {modalType === 'bulk' && (
                <BulkCreateModal
                    onSave={handleBulkCreate}
                    onClose={() => setModalType(null)}
                />
            )}

            <style jsx>{`
                .admin-promos-page {
                    padding: 0;
                }

                .promos-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .promos-header-actions {
                    display: flex;
                    gap: 12px;
                }

                .promos-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 20px;
                    margin-bottom: 32px;
                }

                .promos-stat-card {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    padding: 24px;
                }

                .stat-icon {
                    font-size: 32px;
                    line-height: 1;
                }

                .stat-content {
                    flex: 1;
                }

                .stat-meta {
                    font-size: 12px;
                    color: var(--admin-text-muted);
                    margin-top: 4px;
                }

                .promos-tabs-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                }

                .promos-search {
                    min-width: 250px;
                }

                .promos-search .form-input {
                    width: 100%;
                }

                .promos-bulk-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: var(--admin-surface-light);
                    border-radius: var(--admin-radius-sm);
                    margin-bottom: 16px;
                }

                .promos-loading, .promos-empty {
                    padding: 80px 24px;
                    text-align: center;
                }

                .promos-empty-icon {
                    font-size: 64px;
                    margin-bottom: 16px;
                }

                .promos-empty h3 {
                    font-size: 20px;
                    margin-bottom: 8px;
                }

                .promos-empty p {
                    color: var(--admin-text-muted);
                    margin-bottom: 24px;
                }

                .coupon-code {
                    font-family: 'Fira Code', monospace;
                    font-weight: 600;
                    color: var(--admin-bg-dark);
                    background: rgba(18, 64, 60, 0.08);
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 13px;
                }

                .coupon-type {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    font-weight: 500;
                }

                .coupon-meta {
                    font-size: 11px;
                    color: var(--admin-text-muted);
                    margin-top: 2px;
                }

                .coupon-usage {
                    font-weight: 600;
                }

                .usage-limit {
                    color: var(--admin-text-muted);
                    font-weight: 400;
                }

                .coupon-actions {
                    display: flex;
                    gap: 8px;
                }

                .action-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 4px;
                    border-radius: 4px;
                    transition: background 0.2s;
                }

                .action-btn:hover {
                    background: rgba(0, 0, 0, 0.05);
                }

                .promos-pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 16px;
                    margin-top: 24px;
                }

                .status-badge.status-active {
                    background: rgba(22, 101, 52, 0.1);
                    color: #166534;
                    border: 1px solid rgba(22, 101, 52, 0.15);
                }

                .status-badge.status-inactive {
                    background: rgba(100, 100, 100, 0.1);
                    color: #666;
                    border: 1px solid rgba(100, 100, 100, 0.15);
                }

                .status-badge.status-expired {
                    background: rgba(153, 27, 27, 0.08);
                    color: #991b1b;
                    border: 1px solid rgba(153, 27, 27, 0.15);
                }

                .status-badge.status-scheduled {
                    background: rgba(30, 64, 175, 0.1);
                    color: #1e40af;
                    border: 1px solid rgba(30, 64, 175, 0.15);
                }

                @media (max-width: 768px) {
                    .promos-header {
                        flex-direction: column;
                    }

                    .promos-header-actions {
                        width: 100%;
                    }

                    .promos-tabs-container {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .admin-tabs {
                        overflow-x: auto;
                        width: 100%;
                    }

                    .promos-search {
                        width: 100%;
                    }

                    .admin-table-container {
                        overflow-x: auto;
                    }
                }
            `}</style>
        </div>
    );
}

// ==========================================
// Coupon Modal Component
// ==========================================

function CouponModal({ 
    coupon, 
    onSave, 
    onClose 
}: { 
    coupon: CouponWithStats | null;
    onSave: (data: CouponInput) => Promise<void>;
    onClose: () => void;
}) {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<CouponInput>({
        code: coupon?.code || '',
        discountType: (coupon?.discountType as 'PERCENTAGE' | 'FIXED_AMOUNT') || 'PERCENTAGE',
        discountValue: coupon?.discountValue || 10,
        minOrderValue: coupon?.minOrderValue || null,
        maxDiscount: coupon?.maxDiscount || null,
        startDate: coupon?.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: coupon?.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : null,
        usageLimit: coupon?.usageLimit || null,
        isActive: coupon?.isActive ?? true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.code.trim()) {
            toast.error('Please enter a coupon code');
            return;
        }
        if (form.discountValue <= 0) {
            toast.error('Discount value must be greater than 0');
            return;
        }
        if (form.discountType === 'PERCENTAGE' && form.discountValue > 100) {
            toast.error('Percentage discount cannot exceed 100%');
            return;
        }

        setSaving(true);
        try {
            await onSave(form);
        } finally {
            setSaving(false);
        }
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setForm(f => ({ ...f, code }));
    };

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '16px'
            }} 
            onClick={onClose}
        >
            <div 
                style={{
                    background: '#fff',
                    borderRadius: '20px',
                    width: '100%',
                    maxWidth: '560px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 25px -5px rgba(18, 64, 60, 0.1), 0 10px 10px -5px rgba(18, 64, 60, 0.04)'
                }} 
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>{coupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Code */}
                        <div className="form-group">
                            <label>Coupon Code</label>
                            <div className="input-with-action">
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.code}
                                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                    placeholder="e.g., SAVE20"
                                    required
                                />
                                <button type="button" className="admin-btn admin-btn-outline" onClick={generateCode}>
                                    Generate
                                </button>
                            </div>
                        </div>

                        {/* Discount Type & Value */}
                        <div className="form-row">
                            <div className="form-group">
                                <label>Discount Type</label>
                                <select
                                    className="form-input"
                                    value={form.discountType}
                                    onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT' }))}
                                >
                                    <option value="PERCENTAGE">Percentage (%)</option>
                                    <option value="FIXED_AMOUNT">Fixed Amount (EGP)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Discount Value</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={form.discountValue}
                                    onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))}
                                    min={0}
                                    max={form.discountType === 'PERCENTAGE' ? 100 : 999999}
                                    required
                                />
                            </div>
                        </div>

                        {/* Min Order & Max Discount */}
                        <div className="form-row">
                            <div className="form-group">
                                <label>Minimum Order Value (EGP)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={form.minOrderValue || ''}
                                    onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value ? Number(e.target.value) : null }))}
                                    min={0}
                                    placeholder="No minimum"
                                />
                            </div>
                            {form.discountType === 'PERCENTAGE' && (
                                <div className="form-group">
                                    <label>Maximum Discount (EGP)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={form.maxDiscount || ''}
                                        onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value ? Number(e.target.value) : null }))}
                                        min={0}
                                        placeholder="No cap"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Dates */}
                        <div className="form-row">
                            <div className="form-group">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={form.startDate as string || ''}
                                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>End Date (Optional)</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={form.endDate as string || ''}
                                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value || null }))}
                                />
                            </div>
                        </div>

                        {/* Usage Limit & Status */}
                        <div className="form-row">
                            <div className="form-group">
                                <label>Usage Limit</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={form.usageLimit || ''}
                                    onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value ? Number(e.target.value) : null }))}
                                    min={1}
                                    placeholder="Unlimited"
                                />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    className="form-input"
                                    value={form.isActive ? 'active' : 'inactive'}
                                    onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'active' }))}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="admin-btn admin-btn-outline" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : (coupon ? 'Update Coupon' : 'Create Coupon')}
                        </button>
                    </div>
                </form>

                <style jsx>{`
                    .modal-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        padding: 16px;
                    }

                    .modal-content {
                        background: #fff;
                        border-radius: var(--admin-radius);
                        width: 100%;
                        max-width: 560px;
                        max-height: 90vh;
                        overflow-y: auto;
                        box-shadow: var(--shadow-lg);
                    }

                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px 24px;
                        border-bottom: 1px solid var(--admin-border);
                    }

                    .modal-header h2 {
                        font-size: 20px;
                        font-weight: 600;
                        margin: 0;
                    }

                    .modal-close {
                        background: none;
                        border: none;
                        font-size: 28px;
                        cursor: pointer;
                        color: var(--admin-text-muted);
                        line-height: 1;
                    }

                    .modal-body {
                        padding: 24px;
                    }

                    .modal-footer {
                        display: flex;
                        justify-content: flex-end;
                        gap: 12px;
                        padding: 16px 24px;
                        border-top: 1px solid var(--admin-border);
                        background: var(--admin-surface-light);
                    }

                    .form-group {
                        margin-bottom: 16px;
                    }

                    .form-group label {
                        display: block;
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: var(--admin-text-muted);
                        margin-bottom: 6px;
                    }

                    .form-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 16px;
                    }

                    .input-with-action {
                        display: flex;
                        gap: 8px;
                    }

                    .input-with-action .form-input {
                        flex: 1;
                    }

                    @media (max-width: 540px) {
                        .form-row {
                            grid-template-columns: 1fr;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}

// ==========================================
// Bulk Create Modal Component
// ==========================================

function BulkCreateModal({ 
    onSave, 
    onClose 
}: { 
    onSave: (params: Parameters<typeof bulkCreateCoupons>[0]) => Promise<void>;
    onClose: () => void;
}) {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        prefix: '',
        count: 10,
        discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
        discountValue: 10,
        minOrderValue: null as number | null,
        maxDiscount: null as number | null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: null as string | null,
        usageLimit: 1 as number | null
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.count < 1 || form.count > 100) {
            toast.error('Count must be between 1 and 100');
            return;
        }

        setSaving(true);
        try {
            await onSave({
                prefix: form.prefix,
                count: form.count,
                discountType: form.discountType,
                discountValue: form.discountValue,
                minOrderValue: form.minOrderValue,
                maxDiscount: form.maxDiscount,
                startDate: form.startDate,
                endDate: form.endDate,
                usageLimit: form.usageLimit
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '16px'
            }} 
            onClick={onClose}
        >
            <div 
                style={{
                    background: '#fff',
                    borderRadius: '20px',
                    width: '100%',
                    maxWidth: '500px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 25px -5px rgba(18, 64, 60, 0.1), 0 10px 10px -5px rgba(18, 64, 60, 0.04)'
                }} 
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>Bulk Create Coupons</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Code Prefix</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.prefix}
                                    onChange={e => setForm(f => ({ ...f, prefix: e.target.value.toUpperCase() }))}
                                    placeholder="e.g., PROMO-"
                                    maxLength={10}
                                />
                            </div>
                            <div className="form-group">
                                <label>Number of Coupons</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={form.count}
                                    onChange={e => setForm(f => ({ ...f, count: Number(e.target.value) }))}
                                    min={1}
                                    max={100}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Discount Type</label>
                                <select
                                    className="form-input"
                                    value={form.discountType}
                                    onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT' }))}
                                >
                                    <option value="PERCENTAGE">Percentage (%)</option>
                                    <option value="FIXED_AMOUNT">Fixed Amount (EGP)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Discount Value</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={form.discountValue}
                                    onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))}
                                    min={1}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Usage Limit (per code)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={form.usageLimit || ''}
                                    onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value ? Number(e.target.value) : null }))}
                                    min={1}
                                    placeholder="Unlimited"
                                />
                            </div>
                            <div className="form-group">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={form.endDate || ''}
                                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value || null }))}
                                />
                            </div>
                        </div>

                        <div className="preview-box">
                            <strong>Preview:</strong> {form.prefix}XXXXXXXX (×{form.count})
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="admin-btn admin-btn-outline" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                            {saving ? 'Creating...' : `Create ${form.count} Coupons`}
                        </button>
                    </div>
                </form>

                <style jsx>{`
                    .modal-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        padding: 16px;
                    }

                    .modal-content {
                        background: #fff;
                        border-radius: var(--admin-radius);
                        width: 100%;
                        max-width: 500px;
                        max-height: 90vh;
                        overflow-y: auto;
                        box-shadow: var(--shadow-lg);
                    }

                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px 24px;
                        border-bottom: 1px solid var(--admin-border);
                    }

                    .modal-header h2 {
                        font-size: 20px;
                        font-weight: 600;
                        margin: 0;
                    }

                    .modal-close {
                        background: none;
                        border: none;
                        font-size: 28px;
                        cursor: pointer;
                        color: var(--admin-text-muted);
                        line-height: 1;
                    }

                    .modal-body {
                        padding: 24px;
                    }

                    .modal-footer {
                        display: flex;
                        justify-content: flex-end;
                        gap: 12px;
                        padding: 16px 24px;
                        border-top: 1px solid var(--admin-border);
                        background: var(--admin-surface-light);
                    }

                    .form-group {
                        margin-bottom: 16px;
                    }

                    .form-group label {
                        display: block;
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: var(--admin-text-muted);
                        margin-bottom: 6px;
                    }

                    .form-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 16px;
                    }

                    .preview-box {
                        margin-top: 16px;
                        padding: 16px;
                        background: var(--admin-surface-light);
                        border-radius: 8px;
                        font-family: 'Fira Code', monospace;
                        text-align: center;
                    }
                `}</style>
            </div>
        </div>
    );
}
