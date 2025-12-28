"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { toast } from 'sonner';

type ProductsSettings = {
    // Display
    productsPerPage: number;
    defaultSortOrder: string;
    showOutOfStock: boolean;
    showStockQuantity: boolean;
    lowStockThreshold: number;
    
    // Images
    thumbnailSize: number;
    productImageSize: number;
    galleryImageSize: number;
    enableZoom: boolean;
    enableImageGallery: boolean;
    lazyLoadImages: boolean;
    imageQuality: number;
    
    // Pricing
    showComparePrice: boolean;
    showSalePercentage: boolean;
    showPriceRange: boolean;
    priceRoundingMethod: string;
    
    // SKU & Inventory
    autoGenerateSKU: boolean;
    skuPrefix: string;
    trackInventory: boolean;
    allowBackorders: boolean;
    reserveStockOnCart: boolean;
    cartReservationMinutes: number;
    
    // Product Types
    enableVariants: boolean;
    maxVariantOptions: number;
    enableDigitalProducts: boolean;
    enableSubscriptions: boolean;
    
    // Product Page
    showRelatedProducts: boolean;
    relatedProductsCount: number;
    showRecentlyViewed: boolean;
    recentlyViewedCount: number;
    enableProductReviews: boolean;
    enableProductQuestions: boolean;
    showVendorInfo: boolean;
    
    // SEO
    autoGenerateMetaTitle: boolean;
    autoGenerateMetaDescription: boolean;
    includeSkuInMeta: boolean;
    enableSchemaMarkup: boolean;
    
    // Filters
    enableFiltering: boolean;
    enablePriceFilter: boolean;
    enableColorFilter: boolean;
    enableSizeFilter: boolean;
    enableBrandFilter: boolean;
    enableRatingFilter: boolean;
    enableSorting: boolean;
};

const defaultSettings: ProductsSettings = {
    productsPerPage: 12,
    defaultSortOrder: 'newest',
    showOutOfStock: true,
    showStockQuantity: false,
    lowStockThreshold: 5,
    
    thumbnailSize: 100,
    productImageSize: 600,
    galleryImageSize: 1200,
    enableZoom: true,
    enableImageGallery: true,
    lazyLoadImages: true,
    imageQuality: 85,
    
    showComparePrice: true,
    showSalePercentage: true,
    showPriceRange: true,
    priceRoundingMethod: 'none',
    
    autoGenerateSKU: true,
    skuPrefix: 'SKU-',
    trackInventory: true,
    allowBackorders: false,
    reserveStockOnCart: true,
    cartReservationMinutes: 15,
    
    enableVariants: true,
    maxVariantOptions: 3,
    enableDigitalProducts: false,
    enableSubscriptions: false,
    
    showRelatedProducts: true,
    relatedProductsCount: 4,
    showRecentlyViewed: true,
    recentlyViewedCount: 6,
    enableProductReviews: true,
    enableProductQuestions: true,
    showVendorInfo: false,
    
    autoGenerateMetaTitle: true,
    autoGenerateMetaDescription: true,
    includeSkuInMeta: false,
    enableSchemaMarkup: true,
    
    enableFiltering: true,
    enablePriceFilter: true,
    enableColorFilter: true,
    enableSizeFilter: true,
    enableBrandFilter: true,
    enableRatingFilter: true,
    enableSorting: true,
};

export default function ProductsSettingsPage() {
    const [settings, setSettings] = useState<ProductsSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('display');

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('products_settings');
                if (data) setSettings({ ...defaultSettings, ...(data as Partial<ProductsSettings>) });
            } catch {
                console.error('Failed to load settings');
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateStoreConfig('products_settings', settings);
            toast.success('Products settings saved!');
        } catch {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'display', label: 'Display', icon: '📋' },
        { id: 'images', label: 'Images', icon: '🖼️' },
        { id: 'pricing', label: 'Pricing', icon: '💰' },
        { id: 'inventory', label: 'Inventory', icon: '📦' },
        { id: 'types', label: 'Product Types', icon: '🏷️' },
        { id: 'page', label: 'Product Page', icon: '📄' },
        { id: 'seo', label: 'SEO', icon: '🔍' },
        { id: 'filters', label: 'Filters', icon: '🔬' },
    ];

    if (loading) {
        return <div className="settings-loading"><div className="skeleton" style={{ height: '400px', borderRadius: '20px' }} /></div>;
    }

    return (
        <div>
            <div className="settings-page-header">
                <h1 className="settings-page-title">Products & Catalog</h1>
                <p className="settings-page-description">Product display, inventory, and catalog settings (50+ options)</p>
            </div>

            <div className="settings-tabs">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}>
                        <span>{tab.icon}</span><span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {activeTab === 'display' && (
                <SettingsSection title="Display Settings" description="How products appear in listings" icon="📋">
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label="Products Per Page">
                            <AdminDropdown value={String(settings.productsPerPage)} onChange={(v) => setSettings({ ...settings, productsPerPage: Number(v) })} options={[{ value: '8', label: '8' }, { value: '12', label: '12' }, { value: '16', label: '16' }, { value: '24', label: '24' }, { value: '36', label: '36' }, { value: '48', label: '48' }]} />
                        </SettingsField>
                        <SettingsField label="Default Sort Order">
                            <AdminDropdown value={settings.defaultSortOrder} onChange={(v) => setSettings({ ...settings, defaultSortOrder: v })} options={[{ value: 'newest', label: 'Newest First' }, { value: 'oldest', label: 'Oldest First' }, { value: 'price-asc', label: 'Price: Low to High' }, { value: 'price-desc', label: 'Price: High to Low' }, { value: 'name-asc', label: 'Name: A-Z' }, { value: 'name-desc', label: 'Name: Z-A' }, { value: 'popularity', label: 'Most Popular' }, { value: 'rating', label: 'Highest Rated' }]} />
                        </SettingsField>
                        <SettingsField label="Low Stock Threshold">
                            <input type="number" value={settings.lowStockThreshold} onChange={(e) => setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })} min={1} max={100} />
                        </SettingsField>
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info"><div className="settings-toggle-label">Show Out of Stock Products</div><div className="settings-toggle-description">Display products even when unavailable</div></div>
                        <ToggleSwitch checked={settings.showOutOfStock} onChange={(c) => setSettings({ ...settings, showOutOfStock: c })} />
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info"><div className="settings-toggle-label">Show Stock Quantity</div><div className="settings-toggle-description">Display exact stock numbers to customers</div></div>
                        <ToggleSwitch checked={settings.showStockQuantity} onChange={(c) => setSettings({ ...settings, showStockQuantity: c })} />
                    </div>
                </SettingsSection>
            )}

            {activeTab === 'images' && (
                <SettingsSection title="Image Settings" description="Product image sizes and behavior" icon="🖼️">
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label="Thumbnail Size (px)"><input type="number" value={settings.thumbnailSize} onChange={(e) => setSettings({ ...settings, thumbnailSize: Number(e.target.value) })} min={50} max={300} /></SettingsField>
                        <SettingsField label="Product Image Size (px)"><input type="number" value={settings.productImageSize} onChange={(e) => setSettings({ ...settings, productImageSize: Number(e.target.value) })} min={300} max={1200} /></SettingsField>
                        <SettingsField label="Gallery Image Size (px)"><input type="number" value={settings.galleryImageSize} onChange={(e) => setSettings({ ...settings, galleryImageSize: Number(e.target.value) })} min={600} max={2400} /></SettingsField>
                    </div>
                    <SettingsField label="Image Quality (%)"><input type="number" value={settings.imageQuality} onChange={(e) => setSettings({ ...settings, imageQuality: Number(e.target.value) })} min={50} max={100} style={{ maxWidth: '150px' }} /></SettingsField>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Image Zoom</div><div className="settings-toggle-description">Zoom on hover in product pages</div></div><ToggleSwitch checked={settings.enableZoom} onChange={(c) => setSettings({ ...settings, enableZoom: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Image Gallery</div><div className="settings-toggle-description">Lightbox gallery for product images</div></div><ToggleSwitch checked={settings.enableImageGallery} onChange={(c) => setSettings({ ...settings, enableImageGallery: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Lazy Load Images</div><div className="settings-toggle-description">Load images as they come into view</div></div><ToggleSwitch checked={settings.lazyLoadImages} onChange={(c) => setSettings({ ...settings, lazyLoadImages: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'pricing' && (
                <SettingsSection title="Pricing Display" description="How prices are shown" icon="💰">
                    <SettingsField label="Price Rounding">
                        <AdminDropdown value={settings.priceRoundingMethod} onChange={(v) => setSettings({ ...settings, priceRoundingMethod: v })} options={[{ value: 'none', label: 'No Rounding' }, { value: 'up', label: 'Round Up' }, { value: 'down', label: 'Round Down' }, { value: 'nearest', label: 'Round to Nearest' }]} />
                    </SettingsField>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Compare/Original Price</div><div className="settings-toggle-description">Strike-through original price on sale</div></div><ToggleSwitch checked={settings.showComparePrice} onChange={(c) => setSettings({ ...settings, showComparePrice: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Sale Percentage</div><div className="settings-toggle-description">Display discount percentage badge</div></div><ToggleSwitch checked={settings.showSalePercentage} onChange={(c) => setSettings({ ...settings, showSalePercentage: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Price Range</div><div className="settings-toggle-description">Show min-max for variable products</div></div><ToggleSwitch checked={settings.showPriceRange} onChange={(c) => setSettings({ ...settings, showPriceRange: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'inventory' && (
                <SettingsSection title="Inventory Management" description="Stock tracking and SKU settings" icon="📦">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Track Inventory</div><div className="settings-toggle-description">Enable stock management</div></div><ToggleSwitch checked={settings.trackInventory} onChange={(c) => setSettings({ ...settings, trackInventory: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Allow Backorders</div><div className="settings-toggle-description">Accept orders for out-of-stock items</div></div><ToggleSwitch checked={settings.allowBackorders} onChange={(c) => setSettings({ ...settings, allowBackorders: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Reserve Stock in Cart</div><div className="settings-toggle-description">Hold stock when added to cart</div></div><ToggleSwitch checked={settings.reserveStockOnCart} onChange={(c) => setSettings({ ...settings, reserveStockOnCart: c })} /></div>
                    {settings.reserveStockOnCart && (
                        <SettingsField label="Cart Reservation Time (minutes)"><input type="number" value={settings.cartReservationMinutes} onChange={(e) => setSettings({ ...settings, cartReservationMinutes: Number(e.target.value) })} min={5} max={60} style={{ maxWidth: '150px' }} /></SettingsField>
                    )}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Auto-Generate SKU</div><div className="settings-toggle-description">Create SKU automatically for new products</div></div><ToggleSwitch checked={settings.autoGenerateSKU} onChange={(c) => setSettings({ ...settings, autoGenerateSKU: c })} /></div>
                    {settings.autoGenerateSKU && (
                        <SettingsField label="SKU Prefix"><input type="text" value={settings.skuPrefix} onChange={(e) => setSettings({ ...settings, skuPrefix: e.target.value })} placeholder="SKU-" style={{ maxWidth: '150px' }} /></SettingsField>
                    )}
                </SettingsSection>
            )}

            {activeTab === 'types' && (
                <SettingsSection title="Product Types" description="Enable different product types" icon="🏷️">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Variants</div><div className="settings-toggle-description">Products with size, color options</div></div><ToggleSwitch checked={settings.enableVariants} onChange={(c) => setSettings({ ...settings, enableVariants: c })} /></div>
                    {settings.enableVariants && (
                        <SettingsField label="Max Variant Options"><AdminDropdown value={String(settings.maxVariantOptions)} onChange={(v) => setSettings({ ...settings, maxVariantOptions: Number(v) })} options={[{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }, { value: '5', label: '5' }]} /></SettingsField>
                    )}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Digital Products</div><div className="settings-toggle-description">Downloadable files and licenses</div></div><ToggleSwitch checked={settings.enableDigitalProducts} onChange={(c) => setSettings({ ...settings, enableDigitalProducts: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Subscriptions</div><div className="settings-toggle-description">Recurring billing products</div></div><ToggleSwitch checked={settings.enableSubscriptions} onChange={(c) => setSettings({ ...settings, enableSubscriptions: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'page' && (
                <SettingsSection title="Product Page" description="Individual product page settings" icon="📄">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Related Products</div></div><ToggleSwitch checked={settings.showRelatedProducts} onChange={(c) => setSettings({ ...settings, showRelatedProducts: c })} /></div>
                    {settings.showRelatedProducts && (<SettingsField label="Related Products Count"><input type="number" value={settings.relatedProductsCount} onChange={(e) => setSettings({ ...settings, relatedProductsCount: Number(e.target.value) })} min={2} max={12} style={{ maxWidth: '100px' }} /></SettingsField>)}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Recently Viewed</div></div><ToggleSwitch checked={settings.showRecentlyViewed} onChange={(c) => setSettings({ ...settings, showRecentlyViewed: c })} /></div>
                    {settings.showRecentlyViewed && (<SettingsField label="Recently Viewed Count"><input type="number" value={settings.recentlyViewedCount} onChange={(e) => setSettings({ ...settings, recentlyViewedCount: Number(e.target.value) })} min={2} max={12} style={{ maxWidth: '100px' }} /></SettingsField>)}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Product Reviews</div></div><ToggleSwitch checked={settings.enableProductReviews} onChange={(c) => setSettings({ ...settings, enableProductReviews: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Product Questions</div></div><ToggleSwitch checked={settings.enableProductQuestions} onChange={(c) => setSettings({ ...settings, enableProductQuestions: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Vendor Info</div></div><ToggleSwitch checked={settings.showVendorInfo} onChange={(c) => setSettings({ ...settings, showVendorInfo: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'seo' && (
                <SettingsSection title="Product SEO" description="Search engine optimization" icon="🔍">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Auto-Generate Meta Title</div></div><ToggleSwitch checked={settings.autoGenerateMetaTitle} onChange={(c) => setSettings({ ...settings, autoGenerateMetaTitle: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Auto-Generate Meta Description</div></div><ToggleSwitch checked={settings.autoGenerateMetaDescription} onChange={(c) => setSettings({ ...settings, autoGenerateMetaDescription: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Include SKU in Meta</div></div><ToggleSwitch checked={settings.includeSkuInMeta} onChange={(c) => setSettings({ ...settings, includeSkuInMeta: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Schema Markup</div><div className="settings-toggle-description">Rich snippets for Google</div></div><ToggleSwitch checked={settings.enableSchemaMarkup} onChange={(c) => setSettings({ ...settings, enableSchemaMarkup: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'filters' && (
                <SettingsSection title="Product Filters" description="Filtering options for customers" icon="🔬">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Filtering</div></div><ToggleSwitch checked={settings.enableFiltering} onChange={(c) => setSettings({ ...settings, enableFiltering: c })} /></div>
                    {settings.enableFiltering && (<>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Price Filter</div></div><ToggleSwitch checked={settings.enablePriceFilter} onChange={(c) => setSettings({ ...settings, enablePriceFilter: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Color Filter</div></div><ToggleSwitch checked={settings.enableColorFilter} onChange={(c) => setSettings({ ...settings, enableColorFilter: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Size Filter</div></div><ToggleSwitch checked={settings.enableSizeFilter} onChange={(c) => setSettings({ ...settings, enableSizeFilter: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Brand Filter</div></div><ToggleSwitch checked={settings.enableBrandFilter} onChange={(c) => setSettings({ ...settings, enableBrandFilter: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Rating Filter</div></div><ToggleSwitch checked={settings.enableRatingFilter} onChange={(c) => setSettings({ ...settings, enableRatingFilter: c })} /></div>
                    </>)}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Sorting</div></div><ToggleSwitch checked={settings.enableSorting} onChange={(c) => setSettings({ ...settings, enableSorting: c })} /></div>
                </SettingsSection>
            )}

            <div className="settings-actions"><button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </div>
    );
}
