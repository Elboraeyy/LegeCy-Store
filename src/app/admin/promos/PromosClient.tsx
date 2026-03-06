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
import { getStoreSettings, updateStoreSetting } from '@/lib/actions/settings';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';
import LoyaltySection from './LoyaltySection';
import FlashSalesSection from './_components/FlashSalesSection';
import BOGOSection from './_components/BOGOSection';
import BundlesSection from './_components/BundlesSection';
import ProductOffersSection from './_components/ProductOffersSection';
import AnnouncementSection from './_components/AnnouncementSection';
import SitewideOfferSection from './_components/SitewideOfferSection';

// ==========================================
// Types
// ==========================================

type MainPromoType = 'coupons' | 'flash-sales' | 'bogo' | 'bundles' | 'product-offers' | 'shipping' | 'loyalty' | 'announcement' | 'sitewide-offer';
type TabType = 'all' | 'active' | 'scheduled' | 'expired' | 'inactive';
type ModalType = 'create' | 'edit' | 'bulk' | 'flash-sale' | 'bogo' | 'bundle' | 'product-offer' | null;

// Helper function

// ==========================================
// Main Page Component
// ==========================================

export default function PromosPage() {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const tp = t.promos;

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
            await Promise.all([
                updateStoreSetting('FREE_SHIPPING_THRESHOLD', freeShippingThreshold),
                updateStoreSetting('FREE_SHIPPING_ENABLED', String(isFreeShippingEnabled))
            ]);
            toast.success('Settings saved successfully');
        } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
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
            toast.success(result.isActive ? tp.messages.success_activate : tp.messages.success_deactivate);
            loadData();
        } else {
            toast.error(result.error || tp.messages.error_action);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(tp.messages.confirm_delete)) return;

        const result = await deleteCoupon(id);
        if (result.success) {
            toast.success(tp.messages.success_deactivate);
            loadData();
        } else {
            toast.error(result.error || tp.messages.error_delete);
        }
    };

    const handleDuplicate = async (id: string) => {
        const result = await duplicateCoupon(id);
        if (result.success) {
            toast.success(`${tp.messages.success_create}: ${result.coupon?.code}`);
            loadData();
        } else {
            toast.error(result.error || tp.messages.error_create);
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
        if (!confirm(tp.messages.confirm_delete)) return;
        const result = await deleteBOGO(id);
        if (result.success) {
            toast.success(tp.messages.success_delete);
            loadData();
        } else {
            toast.error(result.error || tp.messages.error_delete);
        }
    };

    // Bundle Handlers
    const handleToggleBundle = async (id: string) => {
        const result = await toggleBundleStatus(id);
        if (result.success) {
            toast.success(result.isActive ? tp.messages.success_activate : tp.messages.success_deactivate);
            loadData();
        } else {
            toast.error(result.error || tp.messages.error_action);
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
            toast.success(result.isActive ? tp.messages.success_activate : tp.messages.success_deactivate);
            loadData();
        } else {
            toast.error(result.error || tp.messages.error_action);
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
    const formatDate = (date: Date | null) => date ? new Date(date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-EG', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'all', label: tp.coupons.tabs.all, icon: '🎫' },
        { id: 'active', label: tp.coupons.tabs.active, icon: '✅' },
        { id: 'scheduled', label: tp.coupons.tabs.scheduled, icon: '📅' },
        { id: 'expired', label: tp.coupons.tabs.expired, icon: '⏰' },
        { id: 'inactive', label: tp.coupons.tabs.inactive, icon: '🚫' },
    ];

    return (
        <div className="admin-promos-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="promos-header">
                <div>
                    <h1 className="admin-title">{tp.title}</h1>
                    <p className="admin-subtitle">{tp.subtitle}</p>
                </div>
            </div>



            {/* Main Promo Type Tabs */}
            <div className="main-promo-tabs">
                <button
                    className={`main-promo-tab ${mainPromoType === 'coupons' ? 'active' : ''}`}
                    onClick={() => setMainPromoType('coupons')}
                >
                    <span className="tab-icon">🎫</span>
                    <span className="tab-label">{tp.tabs.coupons}</span>
                </button>
                <button
                    className={`main-promo-tab ${mainPromoType === 'flash-sales' ? 'active' : ''}`}
                    onClick={() => setMainPromoType('flash-sales')}
                >
                    <span className="tab-icon">⚡</span>
                    <span className="tab-label">{tp.tabs.flash_sales}</span>
                </button>
                <button
                    className={`main-promo-tab ${mainPromoType === 'bogo' ? 'active' : ''}`}
                    onClick={() => setMainPromoType('bogo')}
                >
                    <span className="tab-icon">🎁</span>
                    <span className="tab-label">{tp.tabs.bogo}</span>
                </button>
                <button
                    className={`main-promo-tab ${mainPromoType === 'bundles' ? 'active' : ''}`}
                    onClick={() => setMainPromoType('bundles')}
                >
                    <span className="tab-icon">📦</span>
                    <span className="tab-label">{tp.tabs.bundles}</span>
                </button>
                <button
                    className={`main-promo-tab ${mainPromoType === 'product-offers' ? 'active' : ''}`}
                    onClick={() => setMainPromoType('product-offers')}
                >
                    <span className="tab-icon">🏷️</span>
                    <span className="tab-label">{tp.tabs.offers}</span>
                </button>
                <button
                    className={`main-promo-tab ${mainPromoType === 'shipping' ? 'active' : ''}`}
                    onClick={() => setMainPromoType('shipping')}
                >
                    <span className="tab-icon">🚚</span>
                    <span className="tab-label">{tp.tabs.shipping}</span>
                </button>
                <button
                    className={`main-promo-tab ${mainPromoType === 'loyalty' ? 'active' : ''}`}
                    onClick={() => setMainPromoType('loyalty')}
                >
                    <span className="tab-icon">⭐</span>
                    <span className="tab-label">{tp.tabs.loyalty}</span>
                </button>
                <button
                    className={`main-promo-tab ${mainPromoType === 'announcement' ? 'active' : ''}`}
                    onClick={() => setMainPromoType('announcement')}
                >
                    <span className="tab-icon">📢</span>
                    <span className="tab-label">{language === 'ar' ? 'شريط الإعلانات' : 'Announcement Bar'}</span>
                </button>
                <button
                    className={`main-promo-tab ${mainPromoType === 'sitewide-offer' ? 'active' : ''}`}
                    onClick={() => setMainPromoType('sitewide-offer')}
                >
                    <span className="tab-icon">🎯</span>
                    <span className="tab-label">{language === 'ar' ? 'العرض الشامل' : 'Site-Wide Offer'}</span>
                </button>
            </div>

            {/* Shipping Configuration Section */}
            {mainPromoType === 'shipping' && (
                <>
                    <div className="admin-card mb-8 p-6 bg-white rounded-xl shadow-sm border border-[rgba(18,64,60,0.08)]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#12403C]/5 flex items-center justify-center text-xl">🚚</div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#12403C]">{tp.shipping.title}</h3>
                                    <p className="text-sm text-gray-500">{tp.shipping.desc}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleSaveSettings}
                                disabled={savingSettings}
                                className="px-6 py-2 bg-[#12403C] text-white rounded-lg hover:bg-[#0E3330] transition-colors disabled:opacity-50 font-medium"
                            >
                                {savingSettings ? tp.shipping.saving : tp.shipping.save}
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-[#12403C] mb-1">{tp.shipping.progress_bar}</label>
                                    <p className="text-xs text-gray-500">{tp.shipping.progress_desc}</p>
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
                                    <label className="block text-sm font-semibold text-[#12403C] mb-1">{tp.shipping.threshold}</label>
                                    <p className="text-xs text-gray-500">{tp.shipping.threshold_desc}</p>
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

                    {/* Shipping Coupons Table */}
                    <div className="promo-section">
                        <div className="section-header">
                            <h2>🎫 {tp.shipping.promo_codes}</h2>
                            <div className="section-actions">
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-primary"
                                    onClick={() => { setEditingCoupon(null); setModalType('create'); }}
                                >
                                    <span>+</span> {tp.coupons.create}
                                </button>
                            </div>
                        </div>

                        <div className="admin-card">
                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>{tp.coupons.code}</th>
                                            <th>{tp.coupons.type}</th>
                                            <th>{tp.coupons.value}</th>
                                            <th>{tp.coupons.usage}</th>
                                            <th>{tp.coupons.status}</th>
                                            <th>{tp.coupons.actions}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {coupons
                                            .filter(c => ['FREE_SHIPPING', 'SHIPPING_PERCENTAGE', 'SHIPPING_FIXED'].includes(c.discountType))
                                            .map(coupon => (
                                                <tr key={coupon.id}>
                                                    <td>
                                                        <div className="coupon-code">{coupon.code}</div>
                                                        <div className="coupon-meta">Created {new Date(coupon.createdAt).toLocaleDateString()}</div>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-blue">
                                                            {coupon.discountType.replace('SHIPPING_', '').replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="fw-600">
                                                            {coupon.discountType === 'FREE_SHIPPING' ? tp.shipping.free :
                                                                coupon.discountType === 'SHIPPING_PERCENTAGE' ? `${coupon.discountValue}%` :
                                                                    formatCurrency(coupon.discountValue)}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="text-center">
                                                            <div className="coupon-usage">{coupon.currentUsage}</div>
                                                            <div className="usage-limit">
                                                                {coupon.usageLimit ? `/ ${coupon.usageLimit}` : tp.common.unlimited}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge status-${coupon.status}`}>
                                                            {coupon.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="coupon-actions">
                                                            <button
                                                                className="action-btn"
                                                                onClick={() => handleToggleStatus(coupon.id)}
                                                                title={coupon.isActive ? tp.actions.deactivate : tp.actions.activate}
                                                            >
                                                                {coupon.isActive ? '🚫' : '✅'}
                                                            </button>
                                                            <button
                                                                className="action-btn"
                                                                onClick={() => setEditingCoupon(coupon)}
                                                                title={tp.actions.edit}
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                className="action-btn"
                                                                onClick={() => handleDelete(coupon.id)}
                                                                title={tp.actions.delete}
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        {coupons.filter(c => ['FREE_SHIPPING', 'SHIPPING_PERCENTAGE', 'SHIPPING_FIXED'].includes(c.discountType)).length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-8 text-gray-500">
                                                    {tp.shipping.empty}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Loyalty Section */}
            {mainPromoType === 'loyalty' && (
                <LoyaltySection />
            )}

            {/* Announcement Section */}
            {mainPromoType === 'announcement' && (
                <AnnouncementSection />
            )}

            {/* Site-Wide Offer Section */}
            {mainPromoType === 'sitewide-offer' && (
                <SitewideOfferSection />
            )}

            {/* Coupons Section */}
            {mainPromoType === 'coupons' && (
                <>
                    {/* Coupon Header Actions */}
                    <div className="section-header">
                        <h2>🎫 {tp.coupons.title}</h2>
                        <div className="section-actions">
                            <button
                                type="button"
                                className="admin-btn admin-btn-outline"
                                onClick={() => setModalType('bulk')}
                            >
                                <span>⚡</span> {tp.coupons.bulk_create}
                            </button>
                            <button
                                type="button"
                                className="admin-btn admin-btn-primary"
                                onClick={() => { setEditingCoupon(null); setModalType('create'); }}
                            >
                                <span>+</span> {tp.coupons.new}
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    {analytics && (
                        <div className="promos-stats-grid">
                            <div className="admin-card promos-stat-card">
                                <div className="stat-icon">🎫</div>
                                <div className="stat-content">
                                    <div className="stat-label">{tp.coupons.stats.total}</div>
                                    <div className="stat-value">{analytics.totalCoupons}</div>
                                    <div className="stat-meta">{analytics.activeCoupons} {tp.coupons.stats.active}</div>
                                </div>
                            </div>
                            <div className="admin-card promos-stat-card">
                                <div className="stat-icon">📊</div>
                                <div className="stat-content">
                                    <div className="stat-label">{tp.coupons.stats.usage}</div>
                                    <div className="stat-value">{analytics.totalUsage}</div>
                                    <div className="stat-meta">{tp.coupons.stats.desc}</div>
                                </div>
                            </div>
                            <div className="admin-card promos-stat-card">
                                <div className="stat-icon">💰</div>
                                <div className="stat-content">
                                    <div className="stat-label">{tp.coupons.stats.discounts}</div>
                                    <div className="stat-value">{formatCurrency(analytics.totalDiscountGiven)}</div>
                                    <div className="stat-meta">{tp.coupons.stats.savings}</div>
                                </div>
                            </div>
                            <div className="admin-card promos-stat-card">
                                <div className="stat-icon">📈</div>
                                <div className="stat-content">
                                    <div className="stat-label">{tp.coupons.stats.conversion}</div>
                                    <div className="stat-value">{analytics.conversionRate.toFixed(1)}%</div>
                                    <div className="stat-meta">{analytics.ordersWithCoupons} {tp.coupons.stats.orders}</div>
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
                                placeholder={tp.coupons.search}
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedCoupons.size > 0 && (
                        <div className="promos-bulk-actions">
                            <span>{selectedCoupons.size} {tp.common.selected}</span>
                            <button className="admin-btn admin-btn-outline" onClick={() => handleBulkToggle(true)}>{tp.actions.activate}</button>
                            <button className="admin-btn admin-btn-outline" onClick={() => handleBulkToggle(false)}>{tp.actions.deactivate}</button>
                            <button className="admin-btn admin-btn-outline" onClick={() => setSelectedCoupons(new Set())}>{tp.actions.clear}</button>
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
                                <h3>{tp.coupons.empty_title}</h3>
                                <p>{tp.coupons.empty_desc}</p>
                                <button
                                    className="admin-btn admin-btn-primary"
                                    onClick={() => { setEditingCoupon(null); setModalType('create'); }}
                                >
                                    {tp.coupons.create}
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
                                        <th>{tp.coupons.code}</th>
                                        <th>{tp.coupons.type}</th>
                                        <th>{tp.coupons.value}</th>
                                        <th>{tp.coupons.usage}</th>
                                        <th>{tp.coupons.period}</th>
                                        <th>{tp.coupons.status}</th>
                                        <th>{tp.coupons.actions}</th>
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
                                                    {coupon.discountType === 'PERCENTAGE' ? `📊 ${tp.common.percentage}` : `💵 ${tp.common.fixed}`}
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
                                                    <div className="coupon-meta">{formatCurrency(coupon.totalDiscount)} {tp.common.saved}</div>
                                                )}
                                            </td>
                                            <td>
                                                <div className="coupon-dates">
                                                    <div>{formatDate(coupon.startDate)}</div>
                                                    {coupon.endDate && (
                                                        <div className="coupon-meta">{tp.common.to} {formatDate(coupon.endDate)}</div>
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
                                ← {tp.pagination.previous}
                            </button>
                            <span>{tp.pagination.page_of.replace('{page}', page.toString()).replace('{total}', totalPages.toString())}</span>
                            <button
                                className="admin-btn admin-btn-outline"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                {tp.pagination.next} →
                            </button>
                        </div>
                    )}

                </>
            )}

            {/* Create/Edit Modal */}
            {(modalType === 'create' || modalType === 'edit') && (
                <CouponModal
                    coupon={editingCoupon}
                    onSave={handleSaveCoupon}
                    onClose={() => { setModalType(null); setEditingCoupon(null); }}
                    defaultType={mainPromoType === 'shipping' ? 'FREE_SHIPPING' : undefined}
                    lockType={mainPromoType === 'shipping' && !editingCoupon}
                />
            )}

            {/* Bulk Create Modal */}
            {modalType === 'bulk' && (
                <BulkCreateModal
                    onSave={handleBulkCreate}
                    onClose={() => setModalType(null)}
                />
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



// ==========================================
// BOGO Section
// ==========================================



// ==========================================
// Bundles Section
// ==========================================



// ==========================================
// Product Offers Section
// ==========================================



// ==========================================
// Coupon Modal Component
// ==========================================

function CouponModal({
    coupon,
    onSave,
    onClose,
    defaultType,
    lockType = false
}: {
    coupon: CouponWithStats | null;
    onSave: (data: CouponInput) => Promise<void>;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultType?: any;
    lockType?: boolean;
}) {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const tp = t.promos;
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<CouponInput>({
        code: coupon?.code || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        discountType: (coupon?.discountType as any) || defaultType || 'PERCENTAGE',
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
                    <h2>{coupon ? tp.modals.coupons.edit_title : tp.modals.coupons.create_title}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Code */}
                        <div className="form-group">
                            <label>{tp.modals.coupons.code_label}</label>
                            <div className="input-with-action">
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.code}
                                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                    placeholder={tp.modals.coupons.code_placeholder}
                                    required
                                />
                                <button type="button" className="admin-btn admin-btn-outline" onClick={generateCode}>
                                    {tp.modals.coupons.generate}
                                </button>
                            </div>
                        </div>

                        {/* Discount Type & Value */}
                        <div className="form-row">
                            <div className="form-group">
                                <label>{tp.modals.coupons.discount_type}</label>
                                <select
                                    className="form-input"
                                    value={form.discountType}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    onChange={e => setForm(f => ({ ...f, discountType: e.target.value as any }))}
                                    disabled={lockType}
                                >
                                    <option value="PERCENTAGE">{tp.common.percentage}</option>
                                    <option value="FIXED_AMOUNT">{tp.common.fixed_amount}</option>
                                    <option value="FREE_SHIPPING">{tp.common.free_shipping}</option>
                                    <option value="SHIPPING_PERCENTAGE">{tp.common.shipping_percentage}</option>
                                    <option value="SHIPPING_FIXED">{tp.common.shipping_fixed}</option>
                                </select>
                            </div>
                            {(form.discountType !== 'FREE_SHIPPING') && (
                                <div className="form-group">
                                    <label>{tp.modals.coupons.discount_value}</label>
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
                                <label>{tp.modals.coupons.min_order}</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={form.minOrderValue || ''}
                                    onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value ? Number(e.target.value) : null }))}
                                    min={0}
                                    placeholder={tp.modals.coupons.min_order}
                                />
                            </div>
                            {form.discountType === 'PERCENTAGE' && (
                                <div className="form-group">
                                    <label>{tp.modals.coupons.max_discount}</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={form.maxDiscount || ''}
                                        onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value ? Number(e.target.value) : null }))}
                                        min={0}
                                        placeholder={tp.modals.coupons.max_discount}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Dates */}
                        <div className="form-row">
                            <div className="form-group">
                                <label>{tp.modals.coupons.start_date}</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={form.startDate as string || ''}
                                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>{tp.modals.coupons.end_date}</label>
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
                                <label>{tp.modals.coupons.usage_limit}</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={form.usageLimit || ''}
                                    onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value ? Number(e.target.value) : null }))}
                                    min={1}
                                    placeholder={tp.common.unlimited}
                                />
                            </div>
                            <div className="form-group">
                                <label>{tp.modals.coupons.status}</label>
                                <select
                                    className="form-input"
                                    value={form.isActive ? 'active' : 'inactive'}
                                    onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'active' }))}
                                >
                                    <option value="active">{tp.common.active}</option>
                                    <option value="inactive">{tp.common.inactive}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="admin-btn admin-btn-outline" onClick={onClose}>
                            {tp.common.cancel}
                        </button>
                        <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                            {saving ? tp.common.saving : (coupon ? tp.common.update : tp.coupons.create)}
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
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const tp = t.promos;
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
                    <h2>{tp.modals.coupons.bulk_title}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label>{tp.modals.coupons.prefix_label}</label>
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
                                <label>{tp.modals.coupons.count_label}</label>
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
                                <label>{tp.modals.coupons.discount_type}</label>
                                <select
                                    className="form-input"
                                    value={form.discountType}
                                    onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT' }))}
                                >
                                    <option value="PERCENTAGE">{tp.common.percentage}</option>
                                    <option value="FIXED_AMOUNT">{tp.common.fixed_amount}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{tp.modals.coupons.discount_value}</label>
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
                                <label>{tp.modals.coupons.usage_limit}</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={form.usageLimit || ''}
                                    onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value ? Number(e.target.value) : null }))}
                                    min={1}
                                    placeholder={tp.common.unlimited}
                                />
                            </div>
                            <div className="form-group">
                                <label>{tp.modals.coupons.end_date}</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={form.endDate || ''}
                                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value || null }))}
                                />
                            </div>
                        </div>

                        <div className="preview-box">
                            <strong>{tp.modals.coupons.preview}:</strong> {form.prefix}XXXXXXXX (×{form.count})
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="admin-btn admin-btn-outline" onClick={onClose}>
                            {tp.common.cancel}
                        </button>
                        <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                            {saving ? tp.common.saving : tp.modals.coupons.create_btn}
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
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const tp = t.promos;

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
                    <h2>⚡ {tp.modals.flash_sales.create_title}</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>{tp.modals.flash_sales.name_label}</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder={tp.modals.flash_sales.name_placeholder}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>{tp.modals.coupons.discount_type}</label>
                            <div className="toggle-group">
                                <button
                                    type="button"
                                    className={`toggle-btn ${form.discountType === 'PERCENTAGE' ? 'active' : ''}`}
                                    onClick={() => setForm({ ...form, discountType: 'PERCENTAGE' })}
                                >
                                    {tp.common.percentage}
                                </button>
                                <button
                                    type="button"
                                    className={`toggle-btn ${form.discountType === 'FIXED_AMOUNT' ? 'active' : ''}`}
                                    onClick={() => setForm({ ...form, discountType: 'FIXED_AMOUNT' })}
                                >
                                    {tp.common.fixed_amount}
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>{tp.modals.coupons.discount_value}</label>
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
                            <label>{tp.modals.flash_sales.starts_at}</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={form.startDate ? new Date(form.startDate).toISOString().slice(0, 16) : ''}
                                onChange={e => setForm({ ...form, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>{tp.modals.flash_sales.ends_at}</label>
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
                        <label>{tp.modals.flash_sales.include_products}</label>
                        <div className="product-search-container">
                            <input
                                type="text"
                                className="form-input"
                                placeholder={tp.modals.flash_sales.search_products}
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
                            {tp.common.cancel}
                        </button>
                        <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
                            {loading ? tp.common.saving : tp.modals.flash_sales.create_title}
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
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const tp = t.promos;

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
                    <h2>🎁 {tp.modals.bogo.create_title}</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>{tp.modals.bogo.name_label}</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder={tp.modals.bogo.name_placeholder}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>{tp.modals.bogo.deal_type}</label>
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
                                <option value="BUY_X_GET_Y_FREE">{tp.modals.bogo.types.buy_x_get_y_free}</option>
                                <option value="BUY_X_GET_Y_DISCOUNT">{tp.modals.bogo.types.buy_x_get_y_discount}</option>
                            </select>
                        </div>
                        {form.dealType === 'BUY_X_GET_Y_DISCOUNT' && (
                            <div className="form-group">
                                <label>{tp.modals.bogo.discount_percent}</label>
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
                            <label>{tp.modals.bogo.buy_qty}</label>
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
                            <label>{tp.modals.bogo.get_qty}</label>
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
                            <label>{tp.modals.flash_sales.starts_at}</label>
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
                            <label>{tp.modals.bogo.buy_header}</label>
                            <div className="product-search-container">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={tp.modals.bogo.search_buy}
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
                            <label>{tp.modals.bogo.get_header}</label>
                            <div className="product-search-container">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={tp.modals.bogo.search_get}
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
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const tp = t.promos;

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
                    <h2>📦 {tp.modals.bundles.create_title}</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>{tp.modals.bundles.name_label}</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder={tp.modals.bundles.name_placeholder}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>{tp.modals.bundles.description}</label>
                        <textarea
                            className="form-input"
                            value={form.description || ''}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder={tp.modals.bundles.desc_placeholder}
                            rows={2}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>{tp.modals.flash_sales.starts_at}</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={form.startDate ? new Date(form.startDate).toISOString().slice(0, 16) : ''}
                                onChange={e => setForm({ ...form, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>{tp.modals.flash_sales.ends_at}</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={form.endDate ? new Date(form.endDate).toISOString().slice(0, 16) : ''}
                                onChange={e => setForm({ ...form, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="products-section">
                        <label className="section-label">{tp.modals.bundles.included_products}</label>
                        <div className="product-search-container">
                            <input
                                type="text"
                                className="form-input"
                                placeholder={tp.modals.bundles.search_placeholder}
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
                                    {tp.modals.bundles.total_value}: EGP {totalOriginalPrice.toLocaleString()}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="price-section">
                        <div className="form-group">
                            <label>{tp.modals.bundles.price}</label>
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
                                    {tp.modals.bundles.save_badge.replace('{amount}', 'EGP ' + savings.toLocaleString()).replace('{percent}', Math.round((savings / totalOriginalPrice) * 100).toString())}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-actions modal-footer">
                        <button type="button" className="admin-btn" onClick={onClose} disabled={loading}>
                            {tp.common.cancel}
                        </button>
                        <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
                            {loading ? tp.common.saving : tp.modals.bundles.create_btn}
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
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const tp = t.promos;

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
    const [selectedTarget, setSelectedTarget] = useState<{ id: string, name: string } | null>(null);
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
                    <h2>🏷️ {tp.modals.offers.create_title}</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>{tp.modals.offers.name_label}</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder={tp.modals.offers.name_placeholder}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>{tp.modals.offers.offer_type}</label>
                            <select
                                className="form-input"
                                value={form.offerType}
                                onChange={e => handleOfferTypeChange(e.target.value as ProductOfferInput['offerType'])}
                            >
                                <option value="PRODUCT">{tp.modals.offers.types.product}</option>
                                <option value="CATEGORY">{tp.modals.offers.types.category}</option>
                                <option value="BRAND">{tp.modals.offers.types.brand}</option>
                                <option value="ALL_PRODUCTS">{tp.modals.offers.types.store}</option>
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
                            <label>{tp.modals.offers.target_label} {form.offerType === 'PRODUCT' ? 'Product' : form.offerType === 'CATEGORY' ? 'Category' : 'Brand'}</label>

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
                                        placeholder={tp.modals.offers.target_placeholder}
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
                            <label>{tp.modals.coupons.discount_type}</label>
                            <select
                                className="form-input"
                                value={form.discountType}
                                onChange={e => setForm({ ...form, discountType: e.target.value as ProductOfferInput['discountType'] })}
                            >
                                <option value="PERCENTAGE">{tp.common.percentage}</option>
                                <option value="FIXED_AMOUNT">{tp.common.fixed_amount}</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{tp.modals.coupons.discount_value}</label>
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
                            <label>{tp.modals.flash_sales.starts_at}</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={form.startDate ? new Date(form.startDate).toISOString().slice(0, 16) : ''}
                                onChange={e => setForm({ ...form, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>{tp.modals.flash_sales.ends_at}</label>
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
                            {tp.common.cancel}
                        </button>
                        <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
                            {loading ? tp.common.saving : tp.modals.offers.create_btn}
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


