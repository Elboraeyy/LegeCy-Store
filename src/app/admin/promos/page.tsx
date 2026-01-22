'use client';

import '@/app/admin/admin.css';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
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
    CouponAnalytics, 
    CouponFilters,
    CouponInput,
    CouponWithStats
} from '@/lib/actions/coupons';
import {
    getFlashSales,
    createFlashSale,
    toggleFlashSaleStatus,
    deleteFlashSale,
    searchProducts,
    FlashSaleInput,
    FlashSaleWithStats,
    ProductSearchResult,
    getBOGODeals,
    createBOGODeal,
    toggleBOGOStatus,
    deleteBOGO,
    BOGOInput,
    BOGOWithStats,
    getBundles,
    createBundle,
    toggleBundleStatus,
    deleteBundle,
    BundleInput,
    BundleWithStats,
    getProductOffers,
    createProductOffer,
    toggleProductOfferStatus,
    deleteProductOffer,
    searchCategories,
    ProductOfferInput,
    ProductOfferWithStats
} from '@/lib/actions/promotions';

// ==========================================
// Types
// ==========================================

type MainPromoType = 'coupons' | 'flash-sales' | 'bogo' | 'bundles' | 'product-offers' | 'shipping';
type TabType = 'all' | 'active' | 'scheduled' | 'expired' | 'inactive';
type ModalType = 'create' | 'edit' | 'bulk' | 'flash-sale' | 'bogo' | 'bundle' | 'product-offer' | null;

// Helper function
const formatCurrency = (value: number) => `EGP ${value.toLocaleString()}`;

// ==========================================
// Main Page Component
// ==========================================

export default function PromosPage() {
    // State
    const [mainPromoType, setMainPromoType] = useState<MainPromoType>('coupons');
    // Coupon State
    const [coupons, setCoupons] = useState<CouponWithStats[]>([]);
    const [analytics, setAnalytics] = useState<CouponAnalytics | null>(null);
    // Flash Sale State
    const [flashSales, setFlashSales] = useState<FlashSaleWithStats[]>([]);
    // BOGO State
    const [bogoDeals, setBogoDeals] = useState<BOGOWithStats[]>([]);
    // Bundles State
    const [bundles, setBundles] = useState<BundleWithStats[]>([]);
    // Product Offers State
    const [productOffers, setProductOffers] = useState<ProductOfferWithStats[]>([]);
    
    // Shared State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [modalType, setModalType] = useState<ModalType>(null);
    const [editingCoupon, setEditingCoupon] = useState<CouponWithStats | null>(null);
    const [selectedCoupons, setSelectedCoupons] = useState<Set<string>>(new Set());

    // Settings State
    const [freeShippingThreshold, setFreeShippingThreshold] = useState('2000');
    const [isFreeShippingEnabled, setIsFreeShippingEnabled] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);

    // Load Data
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Load Settings
            const { getStoreSettings, updateStoreSetting } = await import('@/lib/actions/settings');
            const settings = await getStoreSettings(['FREE_SHIPPING_THRESHOLD', 'FREE_SHIPPING_ENABLED']);
            if (settings['FREE_SHIPPING_THRESHOLD']) setFreeShippingThreshold(settings['FREE_SHIPPING_THRESHOLD']);
            if (settings['FREE_SHIPPING_ENABLED']) setIsFreeShippingEnabled(settings['FREE_SHIPPING_ENABLED'] === 'true');

            if (mainPromoType === 'coupons') {
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
            } else if (mainPromoType === 'flash-sales') {
                const data = await getFlashSales(activeTab === 'all' ? undefined : activeTab);
                setFlashSales(data);
            } else if (mainPromoType === 'bogo') {
                const data = await getBOGODeals(activeTab === 'all' ? undefined : activeTab);
                setBogoDeals(data);
            } else if (mainPromoType === 'bundles') {
                const data = await getBundles(activeTab === 'all' ? undefined : activeTab);
                setBundles(data);
            } else if (mainPromoType === 'product-offers') {
                const data = await getProductOffers(activeTab === 'all' ? undefined : activeTab);
                setProductOffers(data);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load promotions');
        } finally {
            setLoading(false);
        }
    }, [search, activeTab, page, mainPromoType]);

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            const { updateStoreSetting } = await import('@/lib/actions/settings');
            await Promise.all([
                updateStoreSetting('FREE_SHIPPING_THRESHOLD', freeShippingThreshold),
                updateStoreSetting('FREE_SHIPPING_ENABLED', String(isFreeShippingEnabled))
            ]);
            toast.success('Settings saved successfully');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSavingSettings(false);
        }
    };

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

    // Flash Sale Handlers
    const handleToggleFlashSale = async (id: string) => {
        const result = await toggleFlashSaleStatus(id);
        if (result.success) {
            toast.success(`Flash sale ${result.isActive ? 'activated' : 'deactivated'}`);
            loadData();
        } else {
            toast.error(result.error || 'Failed to update status');
        }
    };

    const handleDeleteFlashSale = async (id: string) => {
        if (!confirm('Are you sure you want to delete this flash sale?')) return;
        const result = await deleteFlashSale(id);
        if (result.success) {
            toast.success('Flash sale deleted');
            loadData();
        } else {
            toast.error(result.error || 'Failed to delete flash sale');
        }
    };

    // BOGO Handlers
    const handleToggleBOGO = async (id: string) => {
        const result = await toggleBOGOStatus(id);
        if (result.success) {
            toast.success(`Deal ${result.isActive ? 'activated' : 'deactivated'}`);
            loadData();
        } else {
            toast.error(result.error || 'Failed to update status');
        }
    };

    const handleDeleteBOGO = async (id: string) => {
        if (!confirm('Are you sure you want to delete this BOGO deal?')) return;
        const result = await deleteBOGO(id);
        if (result.success) {
            toast.success('Deal deleted');
            loadData();
        } else {
            toast.error(result.error || 'Failed to delete deal');
        }
    };

    // Bundle Handlers
    const handleToggleBundle = async (id: string) => {
        const result = await toggleBundleStatus(id);
        if (result.success) {
            toast.success(`Bundle ${result.isActive ? 'activated' : 'deactivated'}`);
            loadData();
        } else {
            toast.error(result.error || 'Failed to update status');
        }
    };

    const handleDeleteBundle = async (id: string) => {
        if (!confirm('Are you sure you want to delete this bundle?')) return;
        const result = await deleteBundle(id);
        if (result.success) {
            toast.success('Bundle deleted');
            loadData();
        } else {
            toast.error(result.error || 'Failed to delete bundle');
        }
    };

    // Product Offer Handlers
    const handleToggleProductOffer = async (id: string) => {
        const result = await toggleProductOfferStatus(id);
        if (result.success) {
            toast.success(`Offer ${result.isActive ? 'activated' : 'deactivated'}`);
            loadData();
        } else {
            toast.error(result.error || 'Failed to update status');
        }
    };

    const handleDeleteProductOffer = async (id: string) => {
        if (!confirm('Are you sure you want to delete this offer?')) return;
        const result = await deleteProductOffer(id);
        if (result.success) {
            toast.success('Offer deleted');
            loadData();
        } else {
            toast.error(result.error || 'Failed to delete offer');
        }
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
                    <p className="admin-subtitle">Manage coupon codes, flash sales, bundles, and all promotional campaigns</p>
                </div>
            </div>



            {/* Main Promo Type Tabs */}
            <div className="main-promo-tabs">
                <button 
                    className={`main-promo-tab ${mainPromoType === 'coupons' ? 'active' : ''}`}
                    onClick={() => setMainPromoType('coupons')}
                >
                    <span className="tab-icon">🎫</span>
                    <span className="tab-label">Coupons</span>
                </button>
                <button 
                    className={`main-promo-tab ${mainPromoType === 'flash-sales' ? 'active' : ''}`}
                    onClick={() => setMainPromoType('flash-sales')}
                >
                    <span className="tab-icon">⚡</span>
                    <span className="tab-label">Flash Sales</span>
                </button>
                <button 
                    className={`main-promo-tab ${mainPromoType === 'bogo' ? 'active' : ''}`}
                    onClick={() => setMainPromoType('bogo')}
                >
                    <span className="tab-icon">🎁</span>
                    <span className="tab-label">BOGO</span>
                </button>
                <button 
                    className={`main-promo-tab ${mainPromoType === 'bundles' ? 'active' : ''}`}
                    onClick={() => setMainPromoType('bundles')}
                >
                    <span className="tab-icon">📦</span>
                    <span className="tab-label">Bundles</span>
                </button>
                <button 
                    className={`main-promo-tab ${mainPromoType === 'product-offers' ? 'active' : ''}`}
                    onClick={() => setMainPromoType('product-offers')}
                >
                    <span className="tab-icon">🏷️</span>
                    <span className="tab-label">Product Offers</span>
                </button>
                <button
                    className={`main-promo-tab ${mainPromoType === 'shipping' ? 'active' : ''}`}
                    onClick={() => setMainPromoType('shipping')}
                >
                    <span className="tab-icon">🚚</span>
                    <span className="tab-label">Shipping</span>
                </button>
            </div>

            {/* Shipping Configuration Section */}
            {mainPromoType === 'shipping' && (
                <div className="admin-card mb-8 p-6 bg-white rounded-xl shadow-sm border border-[rgba(18,64,60,0.08)]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#12403C]/5 flex items-center justify-center text-xl">🚚</div>
                            <div>
                                <h3 className="text-lg font-bold text-[#12403C]">Free Shipping Configuration</h3>
                                <p className="text-sm text-gray-500">Manage free shipping threshold and progress bar visibility</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSaveSettings}
                            disabled={savingSettings}
                            className="px-6 py-2 bg-[#12403C] text-white rounded-lg hover:bg-[#0E3330] transition-colors disabled:opacity-50 font-medium"
                        >
                            {savingSettings ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-[#12403C] mb-1">Progress Bar Visibility</label>
                                <p className="text-xs text-gray-500">Show/hide the progress bar in Cart & Checkout</p>
                            </div>
                            <div
                                className="relative w-12 h-7 bg-gray-200 rounded-full cursor-pointer transition-colors"
                                style={{ backgroundColor: isFreeShippingEnabled ? '#12403C' : '#e5e7eb' }}
                                onClick={() => setIsFreeShippingEnabled(!isFreeShippingEnabled)}
                            >
                                <div
                                    className="absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform"
                                    style={{ transform: isFreeShippingEnabled ? 'translateX(20px)' : 'translateX(0)' }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-[#12403C] mb-1">Free Shipping Threshold (EGP)</label>
                                <p className="text-xs text-gray-500">Minimum amount to trigger free shipping</p>
                            </div>
                            <input
                                type="number"
                                value={freeShippingThreshold}
                                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                                className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-right font-medium focus:border-[#12403C] focus:ring-1 focus:ring-[#12403C] outline-none"
                                placeholder="2000"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Coupons Section */}
            {mainPromoType === 'coupons' && (
                <>
                    {/* Coupon Header Actions */}
                    <div className="section-header">
                        <h2>🎫 Coupon Codes</h2>
                        <div className="section-actions">
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

            </>
            )}

            {/* Flash Sale Modal */}
            {modalType === 'flash-sale' && (
                <FlashSaleModal
                    onClose={() => setModalType(null)}
                    onSave={async (data) => {
                        const result = await createFlashSale(data);
                        if (result.success) {
                            toast.success('Flash sale created');
                            setModalType(null);
                            loadData();
                        } else {
                            toast.error(result.error || 'Failed to create flash sale');
                        }
                    }}
                />
            )}

            {/* BOGO Modal */}
            {modalType === 'bogo' && (
                <BOGOModal
                    onClose={() => setModalType(null)}
                    onSave={async (data) => {
                        const result = await createBOGODeal(data);
                        if (result.success) {
                            toast.success('BOGO deal created');
                            setModalType(null);
                            loadData();
                        } else {
                            toast.error(result.error || 'Failed to create deal');
                        }
                    }}
                />
            )}

            {/* Bundle Modal */}
            {modalType === 'bundle' && (
                <BundleModal
                    onClose={() => setModalType(null)}
                    onSave={async (data) => {
                        const result = await createBundle(data);
                        if (result.success) {
                            toast.success('Bundle created');
                            setModalType(null);
                            loadData();
                        } else {
                            toast.error(result.error || 'Failed to create bundle');
                        }
                    }}
                />
            )}

            {/* Product Offer Modal */}
            {modalType === 'product-offer' && (
                <ProductOfferModal
                    onClose={() => setModalType(null)}
                    onSave={async (data) => {
                        const result = await createProductOffer(data);
                        if (result.success) {
                            toast.success('Offer created');
                            setModalType(null);
                            loadData();
                        } else {
                            toast.error(result.error || 'Failed to create offer');
                        }
                    }}
                />
            )}

            {/* Flash Sales Section */}
            {mainPromoType === 'flash-sales' && (
                <FlashSalesSection 
                    flashSales={flashSales}
                    onCreate={() => setModalType('flash-sale')}
                    onToggle={handleToggleFlashSale}
                    onDelete={handleDeleteFlashSale}
                />
            )}

            {/* BOGO Section */}
            {mainPromoType === 'bogo' && (
                <BOGOSection 
                    deals={bogoDeals}
                    onCreate={() => setModalType('bogo')}
                    onToggle={handleToggleBOGO}
                    onDelete={handleDeleteBOGO}
                />
            )}

            {/* Bundles Section */}
            {mainPromoType === 'bundles' && (
                <BundlesSection 
                    bundles={bundles}
                    onCreate={() => setModalType('bundle')}
                    onToggle={handleToggleBundle}
                    onDelete={handleDeleteBundle}
                />
            )}

            {/* Product Offers Section */}
            {mainPromoType === 'product-offers' && (
                <ProductOffersSection 
                    offers={productOffers}
                    onCreate={() => setModalType('product-offer')}
                    onToggle={handleToggleProductOffer}
                    onDelete={handleDeleteProductOffer}
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
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .main-promo-tabs {
                    display: flex;
                    gap: 8px;
                    padding: 8px;
                    background: #f5f5f5;
                    border-radius: 16px;
                    margin-bottom: 32px;
                    overflow-x: auto;
                }

                .main-promo-tab {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 14px 24px;
                    background: transparent;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    color: #666;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .main-promo-tab:hover {
                    background: rgba(255, 255, 255, 0.5);
                    color: #333;
                }

                .main-promo-tab.active {
                    background: #fff;
                    color: #12403C;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                }

                .main-promo-tab .tab-icon {
                    font-size: 18px;
                }

                .main-promo-tab .tab-label {
                    font-weight: 600;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .section-header h2 {
                    font-size: 20px;
                    font-weight: 600;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .section-actions {
                    display: flex;
                    gap: 12px;
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
// Flash Sales Section
// ==========================================

// ==========================================
// Flash Sales Section
// ==========================================

function FlashSalesSection({ 
    flashSales, 
    onCreate,
    onToggle,
    onDelete
}: { 
    flashSales: FlashSaleWithStats[];
    onCreate: () => void;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div className="promo-section">
            <div className="section-header">
                <h2>⚡ Flash Sales</h2>
                <div className="section-actions">
                    <button 
                        type="button" 
                        className="admin-btn admin-btn-primary"
                        onClick={onCreate}
                    >
                        <span>+</span> Create Flash Sale
                    </button>
                </div>
            </div>
            
            {flashSales.length === 0 ? (
                <>
                    <div className="admin-card promo-feature-card">
                        {/* Feature Grid (Same as before) */}
                        <div className="feature-grid">
                            <div className="feature-item">
                                <div className="feature-icon">⏰</div>
                                <div className="feature-content">
                                    <h3>Time-Limited Offers</h3>
                                    <p>Create urgency with countdown timers. Sales automatically end when time expires.</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">📊</div>
                                <div className="feature-content">
                                    <h3>Limited Quantities</h3>
                                    <p>Set maximum quantities to create scarcity and drive immediate purchases.</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🏷️</div>
                                <div className="feature-content">
                                    <h3>Deep Discounts</h3>
                                    <p>Apply significant discounts for short periods to boost sales volume.</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">📱</div>
                                <div className="feature-content">
                                    <h3>Homepage Banner</h3>
                                    <p>Automatically display flash sales on the homepage with countdown.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="promo-empty-state">
                        <div className="empty-icon">⚡</div>
                        <h3>No Active Flash Sales</h3>
                        <p>Create your first flash sale to drive urgent purchases</p>
                        <button className="admin-btn admin-btn-primary" onClick={onCreate}>Create Flash Sale</button>
                    </div>
                </>
            ) : (
                <div className="admin-card">
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Status</th>
                                    <th>Discount</th>
                                    <th>Duration</th>
                                    <th>Products</th>
                                    <th>Revenue</th>
                                    <th>Actions</th>
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
                                                <div className="text-xs text-muted">items</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="fw-500">{formatCurrency(sale.revenue)}</div>
                                            <div className="text-xs text-muted">{sale.soldCount} sold</div>
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

// ==========================================
// BOGO Section
// ==========================================

function BOGOSection({
    deals,
    onCreate,
    onToggle,
    onDelete
}: {
    deals: BOGOWithStats[];
    onCreate: () => void;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    // Helper to format deal description
    const getDealDescription = (deal: BOGOWithStats) => {
        const buy = `Buy ${deal.buyQuantity}`;
        const get = `Get ${deal.getQuantity}`;
        const discount = deal.discountPercent === 100 
            ? 'Free' 
            : `${deal.discountPercent}% Off`;
        return `${buy}, ${get} ${discount}`;
    };

    return (
        <div className="promo-section">
            <div className="section-header">
                <h2>🎁 Buy One Get One (BOGO)</h2>
                <div className="section-actions">
                    <button 
                        type="button" 
                        className="admin-btn admin-btn-primary"
                        onClick={onCreate}
                    >
                        <span>+</span> Create BOGO Deal
                    </button>
                </div>
            </div>

            {deals.length === 0 ? (
                <div className="admin-card promo-feature-card">
                    {/* Keep existing feature grid */}
                    <div className="feature-grid">
                        <div className="feature-item">
                            <div className="feature-icon">🆓</div>
                            <div className="feature-content">
                                <h3>Buy X Get Y Free</h3>
                                <p>Classic BOGO: Buy one item, get another free.</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">💰</div>
                            <div className="feature-content">
                                <h3>Buy X Get Y at Discount</h3>
                                <p>Buy one item, get second at 50% off or any percentage.</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🔀</div>
                            <div className="feature-content">
                                <h3>Mix & Match</h3>
                                <p>Allow customers to mix different products in the deal.</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">📦</div>
                            <div className="feature-content">
                                <h3>Quantity Tiers</h3>
                                <p>Buy 2 get 1 free, buy 3 get 2 free, and more.</p>
                            </div>
                        </div>
                    </div>

                    <div className="promo-empty-state">
                        <div className="empty-icon">🎁</div>
                        <h3>No BOGO Deals</h3>
                        <p>Create compelling buy-one-get-one offers to increase average order value</p>
                        <button className="admin-btn admin-btn-primary" onClick={onCreate}>Create BOGO Deal</button>
                    </div>
                </div>
            ) : (
                <div className="admin-card">
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Configuration</th>
                                    <th>Dates</th>
                                    <th>Usage</th>
                                    <th>Status</th>
                                    <th>Actions</th>
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
                                                {deal.dealType === 'BUY_X_GET_Y_FREE' ? 'Free Gift' : 'Discounted Item'}
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
                                                <div className="text-xs text-muted">uses</div>
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

// ==========================================
// Bundles Section
// ==========================================

function BundlesSection({
    bundles,
    onCreate,
    onToggle,
    onDelete
}: {
    bundles: BundleWithStats[];
    onCreate: () => void;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div className="promo-section">
            <div className="section-header">
                <h2>📦 Product Bundles</h2>
                <div className="section-actions">
                    <button 
                        type="button" 
                        className="admin-btn admin-btn-primary"
                        onClick={onCreate}
                    >
                        <span>+</span> Create Bundle
                    </button>
                </div>
            </div>

            {bundles.length === 0 ? (
                <div className="admin-card promo-feature-card">
                    <div className="feature-grid">
                        <div className="feature-item">
                            <div className="feature-icon">🛒</div>
                            <div className="feature-content">
                                <h3>Product Bundles</h3>
                                <p>Group complementary products together at a discounted price.</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">👔</div>
                            <div className="feature-content">
                                <h3>Complete the Look</h3>
                                <p>Suggest matching items that go together for a complete outfit.</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">📈</div>
                            <div className="feature-content">
                                <h3>Tiered Pricing</h3>
                                <p>Buy more, save more - progressive discount tiers.</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🎯</div>
                            <div className="feature-content">
                                <h3>Custom Bundles</h3>
                                <p>Let customers build their own bundle from selected items.</p>
                            </div>
                        </div>
                    </div>

                    <div className="promo-empty-state">
                        <div className="empty-icon">📦</div>
                        <h3>No Bundles Created</h3>
                        <p>Create product bundles to increase average order value and move inventory</p>
                        <button className="admin-btn admin-btn-primary" onClick={onCreate}>Create Bundle</button>
                    </div>
                </div>
            ) : (
                <div className="admin-card">
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Bundle Name</th>
                                    <th>Price</th>
                                    <th>Duration</th>
                                    <th>Products</th>
                                    <th>Sales</th>
                                    <th>Status</th>
                                    <th>Actions</th>
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
                                                <div className="text-xs text-muted">items</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="fw-500">EGP {bundle.revenue.toLocaleString()}</div>
                                            <div className="text-xs text-muted">{bundle.soldCount} sold</div>
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

// ==========================================
// Product Offers Section
// ==========================================

function ProductOffersSection({
    offers,
    onCreate,
    onToggle,
    onDelete
}: {
    offers: ProductOfferWithStats[];
    onCreate: () => void;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div className="promo-section">
            <div className="section-header">
                <h2>🏷️ Product & Category Discounts</h2>
                <div className="section-actions">
                    <button 
                        type="button" 
                        className="admin-btn admin-btn-primary"
                        onClick={onCreate}
                    >
                        <span>+</span> Create Offer
                    </button>
                </div>
            </div>

            {offers.length === 0 ? (
                <div className="admin-card promo-feature-card">
                    <div className="feature-grid">
                        <div className="feature-item">
                            <div className="feature-icon">🛍️</div>
                            <div className="feature-content">
                                <h3>Product Discounts</h3>
                                <p>Set specific discounts on individual products.</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">📂</div>
                            <div className="feature-content">
                                <h3>Category Sales</h3>
                                <p>Run sales on entire categories (e.g., &ldquo;20% Off All Shoes&rdquo;).</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🏢</div>
                            <div className="feature-content">
                                <h3>Brand Deals</h3>
                                <p>Promote specific brands with site-wide discounts.</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🌐</div>
                            <div className="feature-content">
                                <h3>Storewide Sales</h3>
                                <p>Apply discounts across the catalog for major events.</p>
                            </div>
                        </div>
                    </div>

                    <div className="promo-empty-state">
                        <div className="empty-icon">🏷️</div>
                        <h3>No Active Offers</h3>
                        <p>Create targeted discounts to drive sales and clear inventory</p>
                        <button className="admin-btn admin-btn-primary" onClick={onCreate}>Create Offer</button>
                    </div>
                </div>
            ) : (
                <div className="admin-card">
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Offer Name</th>
                                    <th>Target</th>
                                    <th>Discount</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                    <th>Actions</th>
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
                                                    : `EGP ${offer.discountValue} OFF`
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
        discountType: (coupon?.discountType as any) || 'PERCENTAGE',
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
                                    onChange={e => setForm(f => ({ ...f, discountType: e.target.value as any }))}
                                >
                                    <option value="PERCENTAGE">Percentage (%)</option>
                                    <option value="FIXED_AMOUNT">Fixed Amount (EGP)</option>
                                    <option value="FREE_SHIPPING">Free Shipping</option>
                                    <option value="SHIPPING_PERCENTAGE">Shipping Discount (%)</option>
                                    <option value="SHIPPING_FIXED">Shipping Discount (EGP)</option>
                                </select>
                            </div>
                            {(form.discountType !== 'FREE_SHIPPING') && (
                                <div className="form-group">
                                    <label>Discount Value</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={form.discountValue}
                                        onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))}
                                        min={0}
                                        max={(form.discountType === 'PERCENTAGE' || form.discountType === 'SHIPPING_PERCENTAGE') ? 100 : 999999}
                                        required
                                    />
                                </div>
                            )}
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

// ==========================================
// Flash Sale Modal
// ==========================================

function FlashSaleModal({ 
    onClose, 
    onSave 
}: { 
    onClose: () => void; 
    onSave: (data: FlashSaleInput) => Promise<void>; 
}) {
    const [form, setForm] = useState<Partial<FlashSaleInput>>({
        name: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        maxQuantity: undefined,
        isActive: true,
        showOnHomepage: true,
        productIds: []
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<ProductSearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                const results = await searchProducts(searchTerm);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    const handleAddProduct = (product: ProductSearchResult) => {
        if (!selectedProducts.find(p => p.id === product.id)) {
            const newSelected = [...selectedProducts, product];
            setSelectedProducts(newSelected);
            setForm(f => ({ ...f, productIds: newSelected.map(p => p.id) }));
            setSearchTerm('');
            setSearchResults([]);
        }
    };

    const handleRemoveProduct = (id: string) => {
        const newSelected = selectedProducts.filter(p => p.id !== id);
        setSelectedProducts(newSelected);
        setForm(f => ({ ...f, productIds: newSelected.map(p => p.id) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSave(form as FlashSaleInput);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>⚡ Create Flash Sale</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>Campaign Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g., Weekend Flash Sale"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Discount Type</label>
                            <div className="toggle-group">
                                <button
                                    type="button"
                                    className={`toggle-btn ${form.discountType === 'PERCENTAGE' ? 'active' : ''}`}
                                    onClick={() => setForm({ ...form, discountType: 'PERCENTAGE' })}
                                >
                                    Percentage (%)
                                </button>
                                <button
                                    type="button"
                                    className={`toggle-btn ${form.discountType === 'FIXED_AMOUNT' ? 'active' : ''}`}
                                    onClick={() => setForm({ ...form, discountType: 'FIXED_AMOUNT' })}
                                >
                                    Fixed Amount
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Value</label>
                            <input
                                type="number"
                                className="form-input"
                                value={form.discountValue || ''}
                                onChange={e => setForm({ ...form, discountValue: Number(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Starts At</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={form.startDate ? new Date(form.startDate).toISOString().slice(0, 16) : ''}
                                onChange={e => setForm({ ...form, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Ends At</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={form.endDate ? new Date(form.endDate).toISOString().slice(0, 16) : ''}
                                onChange={e => setForm({ ...form, endDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Include Products</label>
                        <div className="product-search-container">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            {searchResults.length > 0 && (
                                <div className="search-results">
                                    {searchResults.map(product => (
                                        <div 
                                            key={product.id} 
                                            className="search-result-item"
                                            onClick={() => handleAddProduct(product)}
                                        >
                                            <div className="product-info">
                                                <div className="product-name">{product.name}</div>
                                                <div className="product-price">EGP {product.price}</div>
                                            </div>
                                            <button type="button" className="add-btn">+</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {selectedProducts.length > 0 && (
                            <div className="selected-products">
                                {selectedProducts.map(product => (
                                    <div key={product.id} className="selected-product-item">
                                        <span>{product.name}</span>
                                        <button 
                                            type="button" 
                                            className="remove-btn"
                                            onClick={() => handleRemoveProduct(product.id)}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-actions modal-footer">
                        <button type="button" className="admin-btn" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Flash Sale'}
                        </button>
                    </div>
                </form>
            </div>
            <style jsx>{`
                .toggle-group {
                    display: flex;
                    border: 1px solid var(--admin-border);
                    border-radius: 6px;
                    overflow: hidden;
                }
                .toggle-btn {
                    flex: 1;
                    padding: 8px;
                    border: none;
                    background: #f5f5f5;
                    cursor: pointer;
                    font-size: 13px;
                }
                .toggle-btn.active {
                    background: #fff;
                    font-weight: 600;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
                .product-search-container {
                    position: relative;
                }
                .search-results {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: #fff;
                    border: 1px solid var(--admin-border);
                    border-radius: 6px;
                    max-height: 200px;
                    overflow-y: auto;
                    z-index: 10;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .search-result-item {
                    padding: 8px 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    border-bottom: 1px solid #f0f0f0;
                }
                .search-result-item:hover {
                    background: #f9f9f9;
                }
                .selected-products {
                    margin-top: 8px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .selected-product-item {
                    background: #f0fdf4;
                    border: 1px solid #dcfce7;
                    color: #166534;
                    padding: 4px 10px;
                    border-radius: 16px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .remove-btn {
                    background: none;
                    border: none;
                    color: #166534;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 0;
                    line-height: 1;
                }
            `}</style>
        </div>
    );
}

// ==========================================
// BOGO Modal
// ==========================================

function BOGOModal({ 
    onClose, 
    onSave 
}: { 
    onClose: () => void; 
    onSave: (data: BOGOInput) => Promise<void>; 
}) {
    const [form, setForm] = useState<Partial<BOGOInput>>({
        name: '',
        dealType: 'BUY_X_GET_Y_FREE',
        buyQuantity: 1,
        getQuantity: 1,
        discountPercent: 100,
        mixAndMatch: false,
        isActive: true,
        buyProductIds: [],
        getProductIds: []
    });
    
    // Search states
    const [buySearch, setBuySearch] = useState('');
    const [buyResults, setBuyResults] = useState<ProductSearchResult[]>([]);
    const [selectedBuyProducts, setSelectedBuyProducts] = useState<ProductSearchResult[]>([]);
    
    const [getSearch, setGetSearch] = useState('');
    const [getResults, setGetResults] = useState<ProductSearchResult[]>([]);
    const [selectedGetProducts, setSelectedGetProducts] = useState<ProductSearchResult[]>([]);

    const [loading, setLoading] = useState(false);

    // Search Effects
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (buySearch.length >= 2) {
                const results = await searchProducts(buySearch);
                setBuyResults(results);
            } else {
                setBuyResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [buySearch]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (getSearch.length >= 2) {
                const results = await searchProducts(getSearch);
                setGetResults(results);
            } else {
                setGetResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [getSearch]);

    // Handlers
    const handleAddProduct = (type: 'buy' | 'get', product: ProductSearchResult) => {
        if (type === 'buy') {
            if (!selectedBuyProducts.find(p => p.id === product.id)) {
                const newSelected = [...selectedBuyProducts, product];
                setSelectedBuyProducts(newSelected);
                setForm(f => ({ ...f, buyProductIds: newSelected.map(p => p.id) }));
                setBuySearch('');
                setBuyResults([]);
            }
        } else {
            if (!selectedGetProducts.find(p => p.id === product.id)) {
                const newSelected = [...selectedGetProducts, product];
                setSelectedGetProducts(newSelected);
                setForm(f => ({ ...f, getProductIds: newSelected.map(p => p.id) }));
                setGetSearch('');
                setGetResults([]);
            }
        }
    };

    const handleRemoveProduct = (type: 'buy' | 'get', id: string) => {
        if (type === 'buy') {
            const newSelected = selectedBuyProducts.filter(p => p.id !== id);
            setSelectedBuyProducts(newSelected);
            setForm(f => ({ ...f, buyProductIds: newSelected.map(p => p.id) }));
        } else {
            const newSelected = selectedGetProducts.filter(p => p.id !== id);
            setSelectedGetProducts(newSelected);
            setForm(f => ({ ...f, getProductIds: newSelected.map(p => p.id) }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSave(form as BOGOInput);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>🎁 Create BOGO Deal</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>Campaign Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g., Buy T-Shirt Get Cap Free"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Deal Type</label>
                            <select 
                                className="form-input"
                                value={form.dealType}
                                onChange={e => {
                                    const type = e.target.value as BOGOInput['dealType'];
                                    setForm(f => ({ 
                                        ...f, 
                                        dealType: type,
                                        discountPercent: type === 'BUY_X_GET_Y_FREE' ? 100 : 50
                                    }));
                                }}
                            >
                                <option value="BUY_X_GET_Y_FREE">Buy X Get Y Free</option>
                                <option value="BUY_X_GET_Y_DISCOUNT">Buy X Get Y Discounted</option>
                            </select>
                        </div>
                        {form.dealType === 'BUY_X_GET_Y_DISCOUNT' && (
                            <div className="form-group">
                                <label>Discount % on 2nd Item</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={form.discountPercent}
                                    onChange={e => setForm({ ...form, discountPercent: Number(e.target.value) })}
                                    min={1}
                                    max={100}
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Buy Quantity</label>
                            <input
                                type="number"
                                className="form-input"
                                value={form.buyQuantity}
                                onChange={e => setForm({ ...form, buyQuantity: Number(e.target.value) })}
                                min={1}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Get Quantity</label>
                            <input
                                type="number"
                                className="form-input"
                                value={form.getQuantity}
                                onChange={e => setForm({ ...form, getQuantity: Number(e.target.value) })}
                                min={1}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Starts At</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={form.startDate ? new Date(form.startDate).toISOString().slice(0, 16) : ''}
                                onChange={e => setForm({ ...form, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Ends At (Optional)</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={form.endDate ? new Date(form.endDate).toISOString().slice(0, 16) : ''}
                                onChange={e => setForm({ ...form, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="product-selection-grids">
                        {/* Buy Products Section */}
                        <div className="form-group">
                            <label>Buy These Products (Triggers)</label>
                            <div className="product-search-container">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Search buy products..."
                                    value={buySearch}
                                    onChange={e => setBuySearch(e.target.value)}
                                />
                                {buyResults.length > 0 && (
                                    <div className="search-results">
                                        {buyResults.map(product => (
                                            <div 
                                                key={product.id} 
                                                className="search-result-item"
                                                onClick={() => handleAddProduct('buy', product)}
                                            >
                                                <div className="product-info">
                                                    <div className="product-name">{product.name}</div>
                                                    <div className="product-price">EGP {product.price}</div>
                                                </div>
                                                <button type="button" className="add-btn">+</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {selectedBuyProducts.length > 0 && (
                                <div className="selected-products">
                                    {selectedBuyProducts.map(product => (
                                        <div key={product.id} className="selected-product-item">
                                            <span>{product.name}</span>
                                            <button 
                                                type="button" 
                                                className="remove-btn"
                                                onClick={() => handleRemoveProduct('buy', product.id)}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Get Products Section */}
                        <div className="form-group">
                            <label>Get These Products (Rewards)</label>
                            <div className="product-search-container">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Search reward products..."
                                    value={getSearch}
                                    onChange={e => setGetSearch(e.target.value)}
                                />
                                {getResults.length > 0 && (
                                    <div className="search-results">
                                        {getResults.map(product => (
                                            <div 
                                                key={product.id} 
                                                className="search-result-item"
                                                onClick={() => handleAddProduct('get', product)}
                                            >
                                                <div className="product-info">
                                                    <div className="product-name">{product.name}</div>
                                                    <div className="product-price">EGP {product.price}</div>
                                                </div>
                                                <button type="button" className="add-btn">+</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {selectedGetProducts.length > 0 && (
                                <div className="selected-products">
                                    {selectedGetProducts.map(product => (
                                        <div key={product.id} className="selected-product-item">
                                            <span>{product.name}</span>
                                            <button 
                                                type="button" 
                                                className="remove-btn"
                                                onClick={() => handleRemoveProduct('get', product.id)}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-actions modal-footer">
                        <button type="button" className="admin-btn" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create BOGO Deal'}
                        </button>
                    </div>
                </form>
            </div>
            <style jsx>{`
                .product-search-container {
                    position: relative;
                }
                .search-results {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: #fff;
                    border: 1px solid var(--admin-border);
                    border-radius: 6px;
                    max-height: 200px;
                    overflow-y: auto;
                    z-index: 10;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .search-result-item {
                    padding: 8px 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    border-bottom: 1px solid #f0f0f0;
                }
                .search-result-item:hover {
                    background: #f9f9f9;
                }
                .selected-products {
                    margin-top: 8px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .selected-product-item {
                    background: #f0fdf4;
                    border: 1px solid #dcfce7;
                    color: #166534;
                    padding: 4px 10px;
                    border-radius: 16px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .remove-btn {
                    background: none;
                    border: none;
                    color: #166534;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 0;
                    line-height: 1;
                }
                .product-selection-grids {
                    display: grid;
                    gap: 16px;
                    padding: 16px;
                    background: var(--admin-surface-light);
                    border-radius: 8px;
                    margin-bottom: 16px;
                }
            `}</style>
        </div>
    );
}

// ==========================================
// Bundle Modal
// ==========================================

function BundleModal({ 
    onClose, 
    onSave 
}: { 
    onClose: () => void; 
    onSave: (data: BundleInput) => Promise<void>; 
}) {
    const [form, setForm] = useState<Partial<BundleInput>>({
        name: '',
        originalPrice: 0,
        bundlePrice: 0,
        isActive: true,
        showOnHomepage: false,
        productIds: []
    });
    
    // Search states
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<ProductSearchResult[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<ProductSearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    // Search Effects
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (search.length >= 2) {
                const results = await searchProducts(search);
                setResults(results);
            } else {
                setResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Handlers
    const handleAddProduct = (product: ProductSearchResult) => {
        if (!selectedProducts.find(p => p.id === product.id)) {
            const newSelected = [...selectedProducts, product];
            setSelectedProducts(newSelected);
            setForm(f => ({ ...f, productIds: newSelected.map(p => p.id) }));
            setSearch('');
            setResults([]);
        }
    };

    const handleRemoveProduct = (id: string) => {
        const newSelected = selectedProducts.filter(p => p.id !== id);
        setSelectedProducts(newSelected);
        setForm(f => ({ ...f, productIds: newSelected.map(p => p.id) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((form.productIds?.length || 0) < 2) {
            toast.error('Please select at least 2 products for the bundle');
            return;
        }
        setLoading(true);
        await onSave(form as BundleInput);
    };

    // Calculate total original price
    const totalOriginalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);
    const savings = totalOriginalPrice - (form.bundlePrice || 0);

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>📦 Create Bundle</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>Bundle Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g., Summer Essentials Pack"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description (Optional)</label>
                        <textarea
                            className="form-input"
                            value={form.description || ''}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Describe what's in this bundle..."
                            rows={2}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Starts At</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={form.startDate ? new Date(form.startDate).toISOString().slice(0, 16) : ''}
                                onChange={e => setForm({ ...form, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Ends At (Optional)</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={form.endDate ? new Date(form.endDate).toISOString().slice(0, 16) : ''}
                                onChange={e => setForm({ ...form, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="products-section">
                        <label className="section-label">Included Products</label>
                        <div className="product-search-container">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search products to add..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            {results.length > 0 && (
                                <div className="search-results">
                                    {results.map(product => (
                                        <div 
                                            key={product.id} 
                                            className="search-result-item"
                                            onClick={() => handleAddProduct(product)}
                                        >
                                            <div className="product-info">
                                                <div className="product-name">{product.name}</div>
                                                <div className="product-price">EGP {product.price}</div>
                                            </div>
                                            <button type="button" className="add-btn">+</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedProducts.length > 0 && (
                            <div className="selected-products-list">
                                {selectedProducts.map(product => (
                                    <div key={product.id} className="selected-product-row">
                                        <div className="product-details">
                                            {product.image && <Image src={product.image} alt="" width={40} height={40} className="product-thumb" />}
                                            <div>
                                                <div className="name">{product.name}</div>
                                                <div className="price">EGP {product.price}</div>
                                            </div>
                                        </div>
                                        <button 
                                            type="button" 
                                            className="remove-btn"
                                            onClick={() => handleRemoveProduct(product.id)}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                                <div className="total-original-price">
                                    Total Value: EGP {totalOriginalPrice.toLocaleString()}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="price-section">
                        <div className="form-group">
                            <label>Bundle Price</label>
                            <div className="price-input-wrapper">
                                <span className="currency">EGP</span>
                                <input
                                    type="number"
                                    className="form-input price-input"
                                    value={form.bundlePrice}
                                    onChange={e => setForm({ ...form, bundlePrice: Number(e.target.value) })}
                                    min={0}
                                    required
                                />
                            </div>
                            {form.bundlePrice && form.bundlePrice > 0 && (
                                <div className="savings-badge">
                                    Save EGP {savings.toLocaleString()} 
                                    ({Math.round((savings / totalOriginalPrice) * 100)}% OFF)
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-actions modal-footer">
                        <button type="button" className="admin-btn" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Bundle'}
                        </button>
                    </div>
                </form>
            </div>
            <style jsx>{`
                .products-section {
                    background: var(--admin-surface-light);
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 24px;
                }
                .section-label {
                    display: block;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--admin-text-muted);
                    margin-bottom: 8px;
                }
                .product-search-container {
                    position: relative;
                    margin-bottom: 12px;
                }
                .search-results {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: #fff;
                    border: 1px solid var(--admin-border);
                    border-radius: 6px;
                    max-height: 200px;
                    overflow-y: auto;
                    z-index: 10;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .search-result-item {
                    padding: 8px 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    border-bottom: 1px solid #f0f0f0;
                }
                .search-result-item:hover {
                    background: #f9f9f9;
                }
                .selected-products-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .selected-product-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #fff;
                    padding: 8px 12px;
                    border-radius: 6px;
                    border: 1px solid var(--admin-border);
                }
                .product-details {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .product-thumb {
                    width: 32px;
                    height: 32px;
                    border-radius: 4px;
                    object-fit: cover;
                }
                .product-details .name {
                    font-size: 13px;
                    font-weight: 500;
                }
                .product-details .price {
                    font-size: 11px;
                    color: var(--admin-text-muted);
                }
                .total-original-price {
                    text-align: right;
                    font-size: 12px;
                    color: var(--admin-text-muted);
                    margin-top: 4px;
                }
                .price-input-wrapper {
                    position: relative;
                }
                .currency {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--admin-text-muted);
                    font-size: 13px;
                }
                .price-input {
                    padding-left: 44px;
                    font-size: 16px;
                    font-weight: 600;
                }
                .savings-badge {
                    margin-top: 6px;
                    display: inline-block;
                    background: #dcfce7;
                    color: #166534;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                }
                .remove-btn {
                    background: none;
                    border: none;
                    color: #ef4444;
                    cursor: pointer;
                    font-size: 18px;
                    line-height: 1;
                    padding: 4px;
                }
            `}</style>
        </div>
    );
}

// ==========================================
// Product Offer Modal
// ==========================================

function ProductOfferModal({ 
    onClose, 
    onSave 
}: { 
    onClose: () => void; 
    onSave: (data: ProductOfferInput) => Promise<void>; 
}) {
    const [form, setForm] = useState<Partial<ProductOfferInput>>({
        name: '',
        offerType: 'PRODUCT',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        minQuantity: 1,
        isActive: true,
        priority: 0
    });
    
    // Search states
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<{ id: string; name: string; image?: string | null; price?: number }[]>([]);
    const [selectedTarget, setSelectedTarget] = useState<{id: string, name: string} | null>(null);
    const [loading, setLoading] = useState(false);

    // Search Effects
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (search.length >= 2) {
                if (form.offerType === 'PRODUCT') {
                    const res = await searchProducts(search);
                    setResults(res);
                } else if (form.offerType === 'CATEGORY') {
                    const res = await searchCategories(search);
                    setResults(res);
                }
            } else {
                setResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, form.offerType]);

    // Handle offerType change - reset search state when type changes
    const handleOfferTypeChange = (newType: ProductOfferInput['offerType']) => {
        setSearch('');
        setResults([]);
        setSelectedTarget(null);
        setForm(f => ({ ...f, offerType: newType, targetId: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.offerType !== 'ALL_PRODUCTS' && !form.targetId && !selectedTarget) {
            toast.error('Please select a target for this offer');
            return;
        }
        
        // Build final form data with brand name as targetId if needed
        let finalTargetId = form.targetId;
        if (form.offerType === 'BRAND' && !form.targetId && search) {
             // For brand, we might just use the search text as the ID/Name
             finalTargetId = search;
        }

        setLoading(true);
        await onSave({ ...form, targetId: finalTargetId } as ProductOfferInput);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>🏷️ Create Product Offer</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>Offer Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g., Summer Shoe Sale"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Offer Type</label>
                            <select 
                                className="form-input"
                                value={form.offerType}
                                onChange={e => handleOfferTypeChange(e.target.value as ProductOfferInput['offerType'])}
                            >
                                <option value="PRODUCT">Single Product</option>
                                <option value="CATEGORY">Category</option>
                                <option value="BRAND">Brand</option>
                                <option value="ALL_PRODUCTS">Storewide (All Products)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Priority (Higher runs first)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={form.priority}
                                onChange={e => setForm({ ...form, priority: Number(e.target.value) })}
                                min={0}
                            />
                        </div>
                    </div>

                    {form.offerType !== 'ALL_PRODUCTS' && (
                        <div className="form-group">
                            <label>Target {form.offerType === 'PRODUCT' ? 'Product' : form.offerType === 'CATEGORY' ? 'Category' : 'Brand'}</label>
                            
                            {selectedTarget ? (
                                <div className="selected-target-item">
                                    <span>{selectedTarget.name}</span>
                                    <button 
                                        type="button" 
                                        className="remove-btn"
                                        onClick={() => {
                                            setSelectedTarget(null);
                                            setForm(f => ({ ...f, targetId: undefined }));
                                            setSearch('');
                                        }}
                                    >
                                        &times;
                                    </button>
                                </div>
                            ) : (
                                <div className="product-search-container">
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={`Search ${(form.offerType || 'product').toLowerCase()}...`}
                                        value={search}
                                        onChange={e => {
                                            setSearch(e.target.value);
                                            if (form.offerType === 'BRAND') {
                                                setForm(f => ({ ...f, targetId: e.target.value }));
                                            }
                                        }}
                                    />
                                    {results.length > 0 && (
                                        <div className="search-results">
                                            {results.map(item => (
                                                <div 
                                                    key={item.id} 
                                                    className="search-result-item"
                                                    onClick={() => {
                                                        setSelectedTarget(item);
                                                        setForm(f => ({ ...f, targetId: item.id }));
                                                        setSearch('');
                                                        setResults([]);
                                                    }}
                                                >
                                                    <div className="product-info">
                                                        <div className="product-name">{item.name}</div>
                                                    </div>
                                                    <button type="button" className="add-btn">+</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Discount Type</label>
                            <select 
                                className="form-input"
                                value={form.discountType}
                                onChange={e => setForm({ ...form, discountType: e.target.value as ProductOfferInput['discountType'] })}
                            >
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FIXED_AMOUNT">Fixed Amount (EGP)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Value</label>
                            <input
                                type="number"
                                className="form-input"
                                value={form.discountValue}
                                onChange={e => setForm({ ...form, discountValue: Number(e.target.value) })}
                                min={0}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Starts At</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={form.startDate ? new Date(form.startDate).toISOString().slice(0, 16) : ''}
                                onChange={e => setForm({ ...form, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Ends At (Optional)</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={form.endDate ? new Date(form.endDate).toISOString().slice(0, 16) : ''}
                                onChange={e => setForm({ ...form, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-actions modal-footer">
                        <button type="button" className="admin-btn" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Offer'}
                        </button>
                    </div>
                </form>
            </div>
            <style jsx>{`
                .product-search-container { position: relative; }
                .search-results {
                    position: absolute; top: 100%; left: 0; right: 0;
                    background: #fff; border: 1px solid var(--admin-border);
                    border-radius: 6px; max-height: 200px; overflow-y: auto;
                    z-index: 10;
                }
                .search-result-item {
                    padding: 8px 12px; display: flex; justify-content: space-between;
                    align-items: center; cursor: pointer; border-bottom: 1px solid #f0f0f0;
                }
                .search-result-item:hover { background: #f9f9f9; }
                .selected-target-item {
                    background: #eff6ff; border: 1px solid #dbeafe; color: #1e40af;
                    padding: 8px 12px; border-radius: 6px; display: flex; justify-content: space-between;
                    align-items: center;
                }
                .remove-btn { background: none; border: none; color: #1e40af; cursor: pointer; font-size: 18px; line-height: 1; }
            `}</style>
        </div>
    );
}
