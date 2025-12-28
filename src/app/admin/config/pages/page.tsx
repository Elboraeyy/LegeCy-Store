"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import ColorPicker from '@/components/admin/settings/ColorPicker';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { toast } from 'sonner';

// Impact Preview Component
function ImpactPreview({ title, changes, example }: { title: string; changes: string[]; example: string }) {
    return (
        <div className="impact-preview">
            <div className="impact-preview-header">
                <span className="impact-icon">🔄</span>
                <span className="impact-title">{title}</span>
            </div>
            <div className="impact-changes">
                <strong>What will change:</strong>
                <ul>{changes.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
            <div className="impact-example">
                <strong>Example:</strong>
                <div className="impact-example-box">{example}</div>
            </div>
        </div>
    );
}

type PageBuilderSettings = {
    headerLayout: string;
    headerHeight: number;
    headerBgColor: string;
    headerTextColor: string;
    logoPosition: string;
    showSearchInHeader: boolean;
    showCartInHeader: boolean;
    showAccountInHeader: boolean;
    showWishlistInHeader: boolean;
    stickyHeader: boolean;
    headerShadow: boolean;
    mobileMenuStyle: string;
    announcementBarEnabled: boolean;
    announcementText: string;
    announcementBgColor: string;
    navStyle: string;
    navPosition: string;
    showMegaMenu: boolean;
    megaMenuColumns: number;
    showCategoryImages: boolean;
    navHoverEffect: string;
    footerLayout: string;
    footerBgColor: string;
    footerTextColor: string;
    footerColumns: number;
    showPaymentIcons: boolean;
    showSocialIcons: boolean;
    showNewsletterForm: boolean;
    newsletterTitle: string;
    showBackToTop: boolean;
    copyrightText: string;
    heroStyle: string;
    heroHeight: string;
    sliderAutoplay: boolean;
    sliderInterval: number;
    showFeaturedCategories: boolean;
    categoriesCount: number;
    showFeaturedProducts: boolean;
    featuredProductsTitle: string;
    featuredProductsCount: number;
    showNewArrivals: boolean;
    showBestSellers: boolean;
    showBanners: boolean;
    showTestimonials: boolean;
    showBrands: boolean;
    productLayout: string;
    productImagePosition: string;
    productImageSize: string;
    showThumbnails: boolean;
    thumbnailPosition: string;
    showZoom: boolean;
    showGalleryLightbox: boolean;
    showProductVideo: boolean;
    showSKU: boolean;
    showStock: boolean;
    showBrand: boolean;
    showRating: boolean;
    showShareButtons: boolean;
    showWishlistButton: boolean;
    showBuyNowButton: boolean;
    showSizeGuide: boolean;
    showDeliveryInfo: boolean;
    showRelatedProducts: boolean;
    categoryLayout: string;
    showCategoryImage: boolean;
    showCategoryDescription: boolean;
    showSubcategories: boolean;
    showFilters: boolean;
    filtersPosition: string;
    showSorting: boolean;
    gridColumns: number;
    productsPerPage: number;
    showQuickView: boolean;
    showAddToCart: boolean;
    cartLayout: string;
    showCartImage: boolean;
    showRemoveButton: boolean;
    showQuantitySelector: boolean;
    showEstimatedShipping: boolean;
    showCouponField: boolean;
    showCartNotes: boolean;
    showContinueShopping: boolean;
    emptyCartMessage: string;
    checkoutLayout: string;
    checkoutSteps: boolean;
    showOrderSummary: boolean;
    showLoginOption: boolean;
    showGuestOption: boolean;
    showBillingAddress: boolean;
    showShippingOptions: boolean;
    showPaymentIcons2: boolean;
    showSecurityBadges: boolean;
    showTermsCheckbox: boolean;
    accountLayout: string;
    showAccountSidebar: boolean;
    showProfilePhoto: boolean;
    showWelcomeMessage: boolean;
    showRecentOrders: boolean;
    recentOrdersCount: number;
    showQuickActions: boolean;
    showLoyaltyPoints: boolean;
    showAddressBook: boolean;
    showWishlistSection: boolean;
};

const defaultSettings: PageBuilderSettings = {
    headerLayout: 'logo-center',
    headerHeight: 80,
    headerBgColor: '#ffffff',
    headerTextColor: '#1a1a1a',
    logoPosition: 'left',
    showSearchInHeader: true,
    showCartInHeader: true,
    showAccountInHeader: true,
    showWishlistInHeader: true,
    stickyHeader: true,
    headerShadow: true,
    mobileMenuStyle: 'slide',
    announcementBarEnabled: true,
    announcementText: 'Free shipping on orders over $100',
    announcementBgColor: '#1a3c34',
    navStyle: 'horizontal',
    navPosition: 'below-header',
    showMegaMenu: true,
    megaMenuColumns: 4,
    showCategoryImages: true,
    navHoverEffect: 'underline',
    footerLayout: 'four-columns',
    footerBgColor: '#1a3c34',
    footerTextColor: '#ffffff',
    footerColumns: 4,
    showPaymentIcons: true,
    showSocialIcons: true,
    showNewsletterForm: true,
    newsletterTitle: 'Subscribe to our newsletter',
    showBackToTop: true,
    copyrightText: '© 2025 Legacy Store. All rights reserved.',
    heroStyle: 'full-width',
    heroHeight: '70vh',
    sliderAutoplay: true,
    sliderInterval: 5000,
    showFeaturedCategories: true,
    categoriesCount: 6,
    showFeaturedProducts: true,
    featuredProductsTitle: 'Featured Products',
    featuredProductsCount: 8,
    showNewArrivals: true,
    showBestSellers: true,
    showBanners: true,
    showTestimonials: true,
    showBrands: true,
    productLayout: 'two-columns',
    productImagePosition: 'left',
    productImageSize: 'large',
    showThumbnails: true,
    thumbnailPosition: 'bottom',
    showZoom: true,
    showGalleryLightbox: true,
    showProductVideo: true,
    showSKU: true,
    showStock: true,
    showBrand: true,
    showRating: true,
    showShareButtons: true,
    showWishlistButton: true,
    showBuyNowButton: true,
    showSizeGuide: true,
    showDeliveryInfo: true,
    showRelatedProducts: true,
    categoryLayout: 'sidebar-left',
    showCategoryImage: true,
    showCategoryDescription: true,
    showSubcategories: true,
    showFilters: true,
    filtersPosition: 'sidebar',
    showSorting: true,
    gridColumns: 3,
    productsPerPage: 12,
    showQuickView: true,
    showAddToCart: true,
    cartLayout: 'two-columns',
    showCartImage: true,
    showRemoveButton: true,
    showQuantitySelector: true,
    showEstimatedShipping: true,
    showCouponField: true,
    showCartNotes: true,
    showContinueShopping: true,
    emptyCartMessage: 'Your cart is empty',
    checkoutLayout: 'two-columns',
    checkoutSteps: true,
    showOrderSummary: true,
    showLoginOption: true,
    showGuestOption: true,
    showBillingAddress: true,
    showShippingOptions: true,
    showPaymentIcons2: true,
    showSecurityBadges: true,
    showTermsCheckbox: true,
    accountLayout: 'sidebar',
    showAccountSidebar: true,
    showProfilePhoto: true,
    showWelcomeMessage: true,
    showRecentOrders: true,
    recentOrdersCount: 5,
    showQuickActions: true,
    showLoyaltyPoints: true,
    showAddressBook: true,
    showWishlistSection: true,
};

export default function PageBuilderPage() {
    const [settings, setSettings] = useState<PageBuilderSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('header');
    const [showImpact, setShowImpact] = useState<string | null>(null);

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('page_builder_settings');
                if (data) setSettings({ ...defaultSettings, ...(data as Partial<PageBuilderSettings>) });
            } catch { console.error('Failed to load'); } 
            finally { setLoading(false); }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateStoreConfig('page_builder_settings', settings);
            toast.success('Page settings saved!');
        } catch { toast.error('Failed to save'); } 
        finally { setSaving(false); }
    };

    const tabs = [
        { id: 'header', label: 'Header', icon: '🔝', pages: ['All Pages'] },
        { id: 'navigation', label: 'Navigation', icon: '☰', pages: ['All Pages'] },
        { id: 'footer', label: 'Footer', icon: '🔻', pages: ['All Pages'] },
        { id: 'home', label: 'Home', icon: '🏠', pages: ['Homepage'] },
        { id: 'product', label: 'Product', icon: '📦', pages: ['Product Page'] },
        { id: 'category', label: 'Category', icon: '📂', pages: ['Category Page'] },
        { id: 'cart', label: 'Cart', icon: '🛒', pages: ['Cart Page'] },
        { id: 'checkout', label: 'Checkout', icon: '💳', pages: ['Checkout Page'] },
        { id: 'account', label: 'Account', icon: '👤', pages: ['Account Page'] },
    ];

    if (loading) return <div className="settings-loading"><div className="skeleton" style={{ height: '400px', borderRadius: '20px' }} /></div>;

    return (
        <div>
            <div className="settings-page-header">
                <h1 className="settings-page-title">Page Builder</h1>
                <p className="settings-page-description">Full control over all website pages - 200+ options with change preview</p>
            </div>

            <div className="settings-tabs">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}>
                        <span>{tab.icon}</span><span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {activeTab === 'header' && (
                <>
                    <SettingsSection title="Header Layout" description="Header structure and arrangement" icon="🔝">
                        <SettingsField label="Header Layout" description="Affects: Logo, menu, and icons arrangement">
                            <AdminDropdown
                                value={settings.headerLayout}
                                onChange={(v) => { setSettings({ ...settings, headerLayout: v }); setShowImpact('headerLayout'); }}
                                options={[
                                    { value: 'logo-left', label: 'Logo Left - Menu Right' },
                                    { value: 'logo-center', label: 'Logo Center' },
                                    { value: 'logo-right', label: 'Logo Right - Menu Left' },
                                    { value: 'stacked', label: 'Logo Top - Menu Below' },
                                ]}
                            />
                        </SettingsField>
                        {showImpact === 'headerLayout' && (
                            <ImpactPreview
                                title="Header Layout Change"
                                changes={['Logo position will change on all pages', 'Main menu items will be rearranged', 'Mobile header layout will be affected']}
                                example="With 'Logo Center': Logo appears in the center with search and cart icons on the sides"
                            />
                        )}
                        <div className="settings-grid settings-grid-3">
                            <SettingsField label="Header Height (px)">
                                <input type="number" value={settings.headerHeight} onChange={(e) => setSettings({ ...settings, headerHeight: Number(e.target.value) })} min={50} max={150} />
                            </SettingsField>
                            <SettingsField label="Background Color">
                                <ColorPicker value={settings.headerBgColor} onChange={(c) => setSettings({ ...settings, headerBgColor: c })} />
                            </SettingsField>
                            <SettingsField label="Text Color">
                                <ColorPicker value={settings.headerTextColor} onChange={(c) => setSettings({ ...settings, headerTextColor: c })} />
                            </SettingsField>
                        </div>
                    </SettingsSection>
                    <SettingsSection title="Header Elements" description="Show or hide elements" icon="✨">
                        <div className="settings-toggle-row" onClick={() => setShowImpact('showSearchInHeader')}>
                            <div className="settings-toggle-info"><div className="settings-toggle-label">Show Search</div><div className="settings-toggle-description">Search icon/bar in header</div></div>
                            <ToggleSwitch checked={settings.showSearchInHeader} onChange={(c) => setSettings({ ...settings, showSearchInHeader: c })} />
                        </div>
                        {showImpact === 'showSearchInHeader' && (
                            <ImpactPreview title="Show/Hide Search" changes={['Search button will appear/disappear from header', 'Other elements will be rearranged']} example="When enabled: 🔍 Search icon appears next to cart" />
                        )}
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Cart</div></div><ToggleSwitch checked={settings.showCartInHeader} onChange={(c) => setSettings({ ...settings, showCartInHeader: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Account</div></div><ToggleSwitch checked={settings.showAccountInHeader} onChange={(c) => setSettings({ ...settings, showAccountInHeader: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Wishlist</div></div><ToggleSwitch checked={settings.showWishlistInHeader} onChange={(c) => setSettings({ ...settings, showWishlistInHeader: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Sticky Header</div><div className="settings-toggle-description">Header stays visible when scrolling</div></div><ToggleSwitch checked={settings.stickyHeader} onChange={(c) => setSettings({ ...settings, stickyHeader: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Header Shadow</div></div><ToggleSwitch checked={settings.headerShadow} onChange={(c) => setSettings({ ...settings, headerShadow: c })} /></div>
                    </SettingsSection>
                    <SettingsSection title="Announcement Bar" description="Top promotional banner" icon="📢">
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Announcement Bar</div></div><ToggleSwitch checked={settings.announcementBarEnabled} onChange={(c) => setSettings({ ...settings, announcementBarEnabled: c })} /></div>
                        {settings.announcementBarEnabled && (<>
                            <SettingsField label="Announcement Text"><input type="text" value={settings.announcementText} onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })} /></SettingsField>
                            <SettingsField label="Background Color"><ColorPicker value={settings.announcementBgColor} onChange={(c) => setSettings({ ...settings, announcementBgColor: c })} /></SettingsField>
                        </>)}
                    </SettingsSection>
                </>
            )}

            {activeTab === 'navigation' && (
                <SettingsSection title="Main Navigation" description="Navigation layout and behavior" icon="☰">
                    <SettingsField label="Navigation Style">
                        <AdminDropdown value={settings.navStyle} onChange={(v) => setSettings({ ...settings, navStyle: v })} options={[{ value: 'horizontal', label: 'Horizontal' }, { value: 'mega-menu', label: 'Mega Menu' }, { value: 'dropdown', label: 'Dropdowns' }]} />
                    </SettingsField>
                    <SettingsField label="Navigation Position">
                        <AdminDropdown value={settings.navPosition} onChange={(v) => setSettings({ ...settings, navPosition: v })} options={[{ value: 'in-header', label: 'Inside Header' }, { value: 'below-header', label: 'Below Header' }]} />
                    </SettingsField>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Mega Menu</div><div className="settings-toggle-description">Expanded menus with images</div></div><ToggleSwitch checked={settings.showMegaMenu} onChange={(c) => setSettings({ ...settings, showMegaMenu: c })} /></div>
                    {settings.showMegaMenu && (<>
                        <SettingsField label="Mega Menu Columns"><AdminDropdown value={String(settings.megaMenuColumns)} onChange={(v) => setSettings({ ...settings, megaMenuColumns: Number(v) })} options={[{ value: '3', label: '3 Columns' }, { value: '4', label: '4 Columns' }, { value: '5', label: '5 Columns' }]} /></SettingsField>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Category Images</div></div><ToggleSwitch checked={settings.showCategoryImages} onChange={(c) => setSettings({ ...settings, showCategoryImages: c })} /></div>
                    </>)}
                    <SettingsField label="Hover Effect"><AdminDropdown value={settings.navHoverEffect} onChange={(v) => setSettings({ ...settings, navHoverEffect: v })} options={[{ value: 'underline', label: 'Underline' }, { value: 'background', label: 'Background Change' }, { value: 'color', label: 'Color Change' }, { value: 'none', label: 'None' }]} /></SettingsField>
                </SettingsSection>
            )}

            {activeTab === 'footer' && (
                <SettingsSection title="Footer" description="Footer layout and content" icon="🔻">
                    <SettingsField label="Footer Layout"><AdminDropdown value={settings.footerLayout} onChange={(v) => setSettings({ ...settings, footerLayout: v })} options={[{ value: 'four-columns', label: '4 Columns' }, { value: 'three-columns', label: '3 Columns' }, { value: 'two-columns', label: '2 Columns' }, { value: 'centered', label: 'Centered' }]} /></SettingsField>
                    <div className="settings-grid"><SettingsField label="Background Color"><ColorPicker value={settings.footerBgColor} onChange={(c) => setSettings({ ...settings, footerBgColor: c })} /></SettingsField><SettingsField label="Text Color"><ColorPicker value={settings.footerTextColor} onChange={(c) => setSettings({ ...settings, footerTextColor: c })} /></SettingsField></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Payment Icons</div></div><ToggleSwitch checked={settings.showPaymentIcons} onChange={(c) => setSettings({ ...settings, showPaymentIcons: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Social Icons</div></div><ToggleSwitch checked={settings.showSocialIcons} onChange={(c) => setSettings({ ...settings, showSocialIcons: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Newsletter Form</div></div><ToggleSwitch checked={settings.showNewsletterForm} onChange={(c) => setSettings({ ...settings, showNewsletterForm: c })} /></div>
                    {settings.showNewsletterForm && <SettingsField label="Newsletter Title"><input type="text" value={settings.newsletterTitle} onChange={(e) => setSettings({ ...settings, newsletterTitle: e.target.value })} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Back to Top Button</div></div><ToggleSwitch checked={settings.showBackToTop} onChange={(c) => setSettings({ ...settings, showBackToTop: c })} /></div>
                    <SettingsField label="Copyright Text"><input type="text" value={settings.copyrightText} onChange={(e) => setSettings({ ...settings, copyrightText: e.target.value })} /></SettingsField>
                </SettingsSection>
            )}

            {activeTab === 'home' && (
                <>
                    <SettingsSection title="Hero / Slider" description="Main section at top of page" icon="🖼️">
                        <SettingsField label="Hero Style"><AdminDropdown value={settings.heroStyle} onChange={(v) => setSettings({ ...settings, heroStyle: v })} options={[{ value: 'full-width', label: 'Full Width' }, { value: 'contained', label: 'Contained' }, { value: 'split', label: 'Split' }]} /></SettingsField>
                        <SettingsField label="Hero Height"><AdminDropdown value={settings.heroHeight} onChange={(v) => setSettings({ ...settings, heroHeight: v })} options={[{ value: '50vh', label: 'Half Screen' }, { value: '70vh', label: '70%' }, { value: '100vh', label: 'Full Screen' }, { value: '400px', label: 'Fixed 400px' }]} /></SettingsField>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Autoplay</div></div><ToggleSwitch checked={settings.sliderAutoplay} onChange={(c) => setSettings({ ...settings, sliderAutoplay: c })} /></div>
                        {settings.sliderAutoplay && <SettingsField label="Slide Interval (ms)"><input type="number" value={settings.sliderInterval} onChange={(e) => setSettings({ ...settings, sliderInterval: Number(e.target.value) })} min={2000} max={10000} /></SettingsField>}
                    </SettingsSection>
                    <SettingsSection title="Homepage Sections" description="Control displayed sections" icon="📐">
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Featured Categories</div></div><ToggleSwitch checked={settings.showFeaturedCategories} onChange={(c) => setSettings({ ...settings, showFeaturedCategories: c })} /></div>
                        {settings.showFeaturedCategories && <SettingsField label="Categories Count"><input type="number" value={settings.categoriesCount} onChange={(e) => setSettings({ ...settings, categoriesCount: Number(e.target.value) })} min={3} max={12} style={{ maxWidth: '100px' }} /></SettingsField>}
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Featured Products</div></div><ToggleSwitch checked={settings.showFeaturedProducts} onChange={(c) => setSettings({ ...settings, showFeaturedProducts: c })} /></div>
                        {settings.showFeaturedProducts && <><SettingsField label="Section Title"><input type="text" value={settings.featuredProductsTitle} onChange={(e) => setSettings({ ...settings, featuredProductsTitle: e.target.value })} /></SettingsField><SettingsField label="Products Count"><input type="number" value={settings.featuredProductsCount} onChange={(e) => setSettings({ ...settings, featuredProductsCount: Number(e.target.value) })} min={4} max={16} style={{ maxWidth: '100px' }} /></SettingsField></>}
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">New Arrivals</div></div><ToggleSwitch checked={settings.showNewArrivals} onChange={(c) => setSettings({ ...settings, showNewArrivals: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Best Sellers</div></div><ToggleSwitch checked={settings.showBestSellers} onChange={(c) => setSettings({ ...settings, showBestSellers: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Promotional Banners</div></div><ToggleSwitch checked={settings.showBanners} onChange={(c) => setSettings({ ...settings, showBanners: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Testimonials</div></div><ToggleSwitch checked={settings.showTestimonials} onChange={(c) => setSettings({ ...settings, showTestimonials: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Brands</div></div><ToggleSwitch checked={settings.showBrands} onChange={(c) => setSettings({ ...settings, showBrands: c })} /></div>
                    </SettingsSection>
                </>
            )}

            {activeTab === 'product' && (
                <>
                    <SettingsSection title="Product Page Layout" description="Product display format" icon="📦">
                        <SettingsField label="Layout"><AdminDropdown value={settings.productLayout} onChange={(v) => setSettings({ ...settings, productLayout: v })} options={[{ value: 'two-columns', label: 'Two Columns' }, { value: 'full-width', label: 'Full Width' }, { value: 'image-focus', label: 'Image Focus' }]} /></SettingsField>
                        <SettingsField label="Image Position"><AdminDropdown value={settings.productImagePosition} onChange={(v) => setSettings({ ...settings, productImagePosition: v })} options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} /></SettingsField>
                        <SettingsField label="Image Size"><AdminDropdown value={settings.productImageSize} onChange={(v) => setSettings({ ...settings, productImageSize: v })} options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]} /></SettingsField>
                    </SettingsSection>
                    <SettingsSection title="Image Gallery" description="Product image options" icon="🖼️">
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Thumbnails</div></div><ToggleSwitch checked={settings.showThumbnails} onChange={(c) => setSettings({ ...settings, showThumbnails: c })} /></div>
                        {settings.showThumbnails && <SettingsField label="Thumbnail Position"><AdminDropdown value={settings.thumbnailPosition} onChange={(v) => setSettings({ ...settings, thumbnailPosition: v })} options={[{ value: 'bottom', label: 'Bottom' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} /></SettingsField>}
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Image Zoom</div></div><ToggleSwitch checked={settings.showZoom} onChange={(c) => setSettings({ ...settings, showZoom: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Lightbox Gallery</div></div><ToggleSwitch checked={settings.showGalleryLightbox} onChange={(c) => setSettings({ ...settings, showGalleryLightbox: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Product Video</div></div><ToggleSwitch checked={settings.showProductVideo} onChange={(c) => setSettings({ ...settings, showProductVideo: c })} /></div>
                    </SettingsSection>
                    <SettingsSection title="Product Information" description="Elements displayed" icon="📋">
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">SKU</div></div><ToggleSwitch checked={settings.showSKU} onChange={(c) => setSettings({ ...settings, showSKU: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Stock</div></div><ToggleSwitch checked={settings.showStock} onChange={(c) => setSettings({ ...settings, showStock: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Brand</div></div><ToggleSwitch checked={settings.showBrand} onChange={(c) => setSettings({ ...settings, showBrand: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Rating</div></div><ToggleSwitch checked={settings.showRating} onChange={(c) => setSettings({ ...settings, showRating: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Share Buttons</div></div><ToggleSwitch checked={settings.showShareButtons} onChange={(c) => setSettings({ ...settings, showShareButtons: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Wishlist Button</div></div><ToggleSwitch checked={settings.showWishlistButton} onChange={(c) => setSettings({ ...settings, showWishlistButton: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Buy Now Button</div></div><ToggleSwitch checked={settings.showBuyNowButton} onChange={(c) => setSettings({ ...settings, showBuyNowButton: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Size Guide</div></div><ToggleSwitch checked={settings.showSizeGuide} onChange={(c) => setSettings({ ...settings, showSizeGuide: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Delivery Info</div></div><ToggleSwitch checked={settings.showDeliveryInfo} onChange={(c) => setSettings({ ...settings, showDeliveryInfo: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Related Products</div></div><ToggleSwitch checked={settings.showRelatedProducts} onChange={(c) => setSettings({ ...settings, showRelatedProducts: c })} /></div>
                    </SettingsSection>
                </>
            )}

            {activeTab === 'category' && (
                <SettingsSection title="Category Page" description="Products listing in categories" icon="📂">
                    <SettingsField label="Layout"><AdminDropdown value={settings.categoryLayout} onChange={(v) => setSettings({ ...settings, categoryLayout: v })} options={[{ value: 'sidebar-left', label: 'Sidebar Left' }, { value: 'sidebar-right', label: 'Sidebar Right' }, { value: 'no-sidebar', label: 'No Sidebar' }]} /></SettingsField>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Category Image</div></div><ToggleSwitch checked={settings.showCategoryImage} onChange={(c) => setSettings({ ...settings, showCategoryImage: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Description</div></div><ToggleSwitch checked={settings.showCategoryDescription} onChange={(c) => setSettings({ ...settings, showCategoryDescription: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Subcategories</div></div><ToggleSwitch checked={settings.showSubcategories} onChange={(c) => setSettings({ ...settings, showSubcategories: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Filters</div></div><ToggleSwitch checked={settings.showFilters} onChange={(c) => setSettings({ ...settings, showFilters: c })} /></div>
                    {settings.showFilters && <SettingsField label="Filters Position"><AdminDropdown value={settings.filtersPosition} onChange={(v) => setSettings({ ...settings, filtersPosition: v })} options={[{ value: 'sidebar', label: 'Sidebar' }, { value: 'top', label: 'Top' }, { value: 'drawer', label: 'Side Drawer' }]} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Sorting</div></div><ToggleSwitch checked={settings.showSorting} onChange={(c) => setSettings({ ...settings, showSorting: c })} /></div>
                    <SettingsField label="Grid Columns"><AdminDropdown value={String(settings.gridColumns)} onChange={(v) => setSettings({ ...settings, gridColumns: Number(v) })} options={[{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }]} /></SettingsField>
                    <SettingsField label="Products Per Page"><input type="number" value={settings.productsPerPage} onChange={(e) => setSettings({ ...settings, productsPerPage: Number(e.target.value) })} min={8} max={48} style={{ maxWidth: '100px' }} /></SettingsField>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Quick View</div></div><ToggleSwitch checked={settings.showQuickView} onChange={(c) => setSettings({ ...settings, showQuickView: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Add to Cart Button</div></div><ToggleSwitch checked={settings.showAddToCart} onChange={(c) => setSettings({ ...settings, showAddToCart: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'cart' && (
                <SettingsSection title="Cart Page" description="Shopping cart customization" icon="🛒">
                    <SettingsField label="Layout"><AdminDropdown value={settings.cartLayout} onChange={(v) => setSettings({ ...settings, cartLayout: v })} options={[{ value: 'two-columns', label: 'Two Columns' }, { value: 'single-column', label: 'Single Column' }]} /></SettingsField>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Product Images</div></div><ToggleSwitch checked={settings.showCartImage} onChange={(c) => setSettings({ ...settings, showCartImage: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Remove Button</div></div><ToggleSwitch checked={settings.showRemoveButton} onChange={(c) => setSettings({ ...settings, showRemoveButton: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Quantity Selector</div></div><ToggleSwitch checked={settings.showQuantitySelector} onChange={(c) => setSettings({ ...settings, showQuantitySelector: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Estimated Shipping</div></div><ToggleSwitch checked={settings.showEstimatedShipping} onChange={(c) => setSettings({ ...settings, showEstimatedShipping: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Coupon Field</div></div><ToggleSwitch checked={settings.showCouponField} onChange={(c) => setSettings({ ...settings, showCouponField: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Order Notes</div></div><ToggleSwitch checked={settings.showCartNotes} onChange={(c) => setSettings({ ...settings, showCartNotes: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Continue Shopping</div></div><ToggleSwitch checked={settings.showContinueShopping} onChange={(c) => setSettings({ ...settings, showContinueShopping: c })} /></div>
                    <SettingsField label="Empty Cart Message"><input type="text" value={settings.emptyCartMessage} onChange={(e) => setSettings({ ...settings, emptyCartMessage: e.target.value })} /></SettingsField>
                </SettingsSection>
            )}

            {activeTab === 'checkout' && (
                <SettingsSection title="Checkout Page" description="Purchase process customization" icon="💳">
                    <SettingsField label="Layout"><AdminDropdown value={settings.checkoutLayout} onChange={(v) => setSettings({ ...settings, checkoutLayout: v })} options={[{ value: 'two-columns', label: 'Two Columns' }, { value: 'single-column', label: 'Single Column' }, { value: 'multi-step', label: 'Multi-Step' }]} /></SettingsField>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Checkout Steps</div></div><ToggleSwitch checked={settings.checkoutSteps} onChange={(c) => setSettings({ ...settings, checkoutSteps: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Order Summary</div></div><ToggleSwitch checked={settings.showOrderSummary} onChange={(c) => setSettings({ ...settings, showOrderSummary: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Login Option</div></div><ToggleSwitch checked={settings.showLoginOption} onChange={(c) => setSettings({ ...settings, showLoginOption: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Guest Checkout</div></div><ToggleSwitch checked={settings.showGuestOption} onChange={(c) => setSettings({ ...settings, showGuestOption: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Billing Address</div></div><ToggleSwitch checked={settings.showBillingAddress} onChange={(c) => setSettings({ ...settings, showBillingAddress: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Shipping Options</div></div><ToggleSwitch checked={settings.showShippingOptions} onChange={(c) => setSettings({ ...settings, showShippingOptions: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Payment Icons</div></div><ToggleSwitch checked={settings.showPaymentIcons2} onChange={(c) => setSettings({ ...settings, showPaymentIcons2: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Security Badges</div></div><ToggleSwitch checked={settings.showSecurityBadges} onChange={(c) => setSettings({ ...settings, showSecurityBadges: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Terms Checkbox</div></div><ToggleSwitch checked={settings.showTermsCheckbox} onChange={(c) => setSettings({ ...settings, showTermsCheckbox: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'account' && (
                <SettingsSection title="Account Page" description="Customer dashboard" icon="👤">
                    <SettingsField label="Layout"><AdminDropdown value={settings.accountLayout} onChange={(v) => setSettings({ ...settings, accountLayout: v })} options={[{ value: 'sidebar', label: 'With Sidebar' }, { value: 'tabs', label: 'Tabs' }, { value: 'cards', label: 'Cards' }]} /></SettingsField>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Account Sidebar</div></div><ToggleSwitch checked={settings.showAccountSidebar} onChange={(c) => setSettings({ ...settings, showAccountSidebar: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Profile Photo</div></div><ToggleSwitch checked={settings.showProfilePhoto} onChange={(c) => setSettings({ ...settings, showProfilePhoto: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Welcome Message</div></div><ToggleSwitch checked={settings.showWelcomeMessage} onChange={(c) => setSettings({ ...settings, showWelcomeMessage: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Recent Orders</div></div><ToggleSwitch checked={settings.showRecentOrders} onChange={(c) => setSettings({ ...settings, showRecentOrders: c })} /></div>
                    {settings.showRecentOrders && <SettingsField label="Orders Count"><input type="number" value={settings.recentOrdersCount} onChange={(e) => setSettings({ ...settings, recentOrdersCount: Number(e.target.value) })} min={3} max={10} style={{ maxWidth: '80px' }} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Quick Actions</div></div><ToggleSwitch checked={settings.showQuickActions} onChange={(c) => setSettings({ ...settings, showQuickActions: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Loyalty Points</div></div><ToggleSwitch checked={settings.showLoyaltyPoints} onChange={(c) => setSettings({ ...settings, showLoyaltyPoints: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Address Book</div></div><ToggleSwitch checked={settings.showAddressBook} onChange={(c) => setSettings({ ...settings, showAddressBook: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Wishlist</div></div><ToggleSwitch checked={settings.showWishlistSection} onChange={(c) => setSettings({ ...settings, showWishlistSection: c })} /></div>
                </SettingsSection>
            )}

            <div className="settings-actions"><button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </div>
    );
}
