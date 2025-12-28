"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { toast } from 'sonner';

type AnalyticsSettings = {
    // Google
    enableGoogleAnalytics: boolean;
    googleAnalyticsId: string;
    googleTagManagerId: string;
    enableEnhancedEcommerce: boolean;
    
    // Facebook
    enableFacebookPixel: boolean;
    facebookPixelId: string;
    facebookConversionsApiToken: string;
    trackFacebookEvents: boolean;
    
    // Other
    enableSnapchatPixel: boolean;
    snapchatPixelId: string;
    enableTikTokPixel: boolean;
    tiktokPixelId: string;
    enablePinterestTag: boolean;
    pinterestTagId: string;
    
    // Custom
    enableCustomScripts: boolean;
    headerScripts: string;
    bodyStartScripts: string;
    bodyEndScripts: string;
    
    // Tracking
    trackPageViews: boolean;
    trackProductViews: boolean;
    trackAddToCart: boolean;
    trackCheckout: boolean;
    trackPurchase: boolean;
    trackSearch: boolean;
    trackWishlist: boolean;
    trackSignup: boolean;
    trackLogin: boolean;
    
    // Privacy
    enableCookieConsent: boolean;
    consentMode: string;
    anonymizeIp: boolean;
    respectDoNotTrack: boolean;
    
    // Reports
    enableDashboardReports: boolean;
    enableSalesReports: boolean;
    enableProductReports: boolean;
    enableCustomerReports: boolean;
    enableTrafficReports: boolean;
    reportsEmailFrequency: string;
    reportsEmail: string;
};

const defaultSettings: AnalyticsSettings = {
    enableGoogleAnalytics: false,
    googleAnalyticsId: '',
    googleTagManagerId: '',
    enableEnhancedEcommerce: true,
    
    enableFacebookPixel: false,
    facebookPixelId: '',
    facebookConversionsApiToken: '',
    trackFacebookEvents: true,
    
    enableSnapchatPixel: false,
    snapchatPixelId: '',
    enableTikTokPixel: false,
    tiktokPixelId: '',
    enablePinterestTag: false,
    pinterestTagId: '',
    
    enableCustomScripts: false,
    headerScripts: '',
    bodyStartScripts: '',
    bodyEndScripts: '',
    
    trackPageViews: true,
    trackProductViews: true,
    trackAddToCart: true,
    trackCheckout: true,
    trackPurchase: true,
    trackSearch: true,
    trackWishlist: true,
    trackSignup: true,
    trackLogin: true,
    
    enableCookieConsent: true,
    consentMode: 'opt-in',
    anonymizeIp: true,
    respectDoNotTrack: true,
    
    enableDashboardReports: true,
    enableSalesReports: true,
    enableProductReports: true,
    enableCustomerReports: true,
    enableTrafficReports: true,
    reportsEmailFrequency: 'weekly',
    reportsEmail: '',
};

export default function AnalyticsSettingsPage() {
    const [settings, setSettings] = useState<AnalyticsSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('google');

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('analytics_settings');
                if (data) setSettings({ ...defaultSettings, ...(data as Partial<AnalyticsSettings>) });
            } catch { console.error('Failed to load'); } 
            finally { setLoading(false); }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateStoreConfig('analytics_settings', settings);
            toast.success('Analytics settings saved!');
        } catch { toast.error('Failed to save'); } 
        finally { setSaving(false); }
    };

    const tabs = [
        { id: 'google', label: 'Google', icon: '🔵' },
        { id: 'facebook', label: 'Facebook', icon: '📘' },
        { id: 'social', label: 'Social Pixels', icon: '📱' },
        { id: 'events', label: 'Event Tracking', icon: '📍' },
        { id: 'privacy', label: 'Privacy', icon: '🛡️' },
        { id: 'reports', label: 'Reports', icon: '📊' },
        { id: 'custom', label: 'Custom Scripts', icon: '📜' },
    ];

    if (loading) return <div className="settings-loading"><div className="skeleton" style={{ height: '400px', borderRadius: '20px' }} /></div>;

    return (
        <div>
            <div className="settings-page-header">
                <h1 className="settings-page-title">Analytics & Tracking</h1>
                <p className="settings-page-description">Tracking pixels, reports, and data (55+ options)</p>
            </div>

            <div className="settings-tabs">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}>
                        <span>{tab.icon}</span><span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {activeTab === 'google' && (
                <SettingsSection title="Google Analytics" description="GA4 and GTM integration" icon="🔵">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Google Analytics</div></div><ToggleSwitch checked={settings.enableGoogleAnalytics} onChange={(c) => setSettings({ ...settings, enableGoogleAnalytics: c })} /></div>
                    {settings.enableGoogleAnalytics && (<>
                        <SettingsField label="Google Analytics 4 ID"><input type="text" value={settings.googleAnalyticsId} onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })} placeholder="G-XXXXXXXXXX" /></SettingsField>
                        <SettingsField label="Google Tag Manager ID"><input type="text" value={settings.googleTagManagerId} onChange={(e) => setSettings({ ...settings, googleTagManagerId: e.target.value })} placeholder="GTM-XXXXXXX" /></SettingsField>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enhanced Ecommerce</div><div className="settings-toggle-description">Product impressions, cart, checkout</div></div><ToggleSwitch checked={settings.enableEnhancedEcommerce} onChange={(c) => setSettings({ ...settings, enableEnhancedEcommerce: c })} /></div>
                    </>)}
                </SettingsSection>
            )}

            {activeTab === 'facebook' && (
                <SettingsSection title="Meta Pixel" description="Facebook & Instagram tracking" icon="📘">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Facebook Pixel</div></div><ToggleSwitch checked={settings.enableFacebookPixel} onChange={(c) => setSettings({ ...settings, enableFacebookPixel: c })} /></div>
                    {settings.enableFacebookPixel && (<>
                        <SettingsField label="Pixel ID"><input type="text" value={settings.facebookPixelId} onChange={(e) => setSettings({ ...settings, facebookPixelId: e.target.value })} placeholder="XXXXXXXXXXXXXXX" /></SettingsField>
                        <SettingsField label="Conversions API Token" description="For server-side tracking"><input type="text" value={settings.facebookConversionsApiToken} onChange={(e) => setSettings({ ...settings, facebookConversionsApiToken: e.target.value })} /></SettingsField>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Track Standard Events</div><div className="settings-toggle-description">ViewContent, AddToCart, Purchase</div></div><ToggleSwitch checked={settings.trackFacebookEvents} onChange={(c) => setSettings({ ...settings, trackFacebookEvents: c })} /></div>
                    </>)}
                </SettingsSection>
            )}

            {activeTab === 'social' && (
                <SettingsSection title="Social Media Pixels" description="Snapchat, TikTok, Pinterest" icon="📱">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Snapchat Pixel</div></div><ToggleSwitch checked={settings.enableSnapchatPixel} onChange={(c) => setSettings({ ...settings, enableSnapchatPixel: c })} /></div>
                    {settings.enableSnapchatPixel && <SettingsField label="Snapchat Pixel ID"><input type="text" value={settings.snapchatPixelId} onChange={(e) => setSettings({ ...settings, snapchatPixelId: e.target.value })} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">TikTok Pixel</div></div><ToggleSwitch checked={settings.enableTikTokPixel} onChange={(c) => setSettings({ ...settings, enableTikTokPixel: c })} /></div>
                    {settings.enableTikTokPixel && <SettingsField label="TikTok Pixel ID"><input type="text" value={settings.tiktokPixelId} onChange={(e) => setSettings({ ...settings, tiktokPixelId: e.target.value })} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Pinterest Tag</div></div><ToggleSwitch checked={settings.enablePinterestTag} onChange={(c) => setSettings({ ...settings, enablePinterestTag: c })} /></div>
                    {settings.enablePinterestTag && <SettingsField label="Pinterest Tag ID"><input type="text" value={settings.pinterestTagId} onChange={(e) => setSettings({ ...settings, pinterestTagId: e.target.value })} /></SettingsField>}
                </SettingsSection>
            )}

            {activeTab === 'events' && (
                <SettingsSection title="Event Tracking" description="What events to track" icon="📍">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Page Views</div></div><ToggleSwitch checked={settings.trackPageViews} onChange={(c) => setSettings({ ...settings, trackPageViews: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Product Views</div></div><ToggleSwitch checked={settings.trackProductViews} onChange={(c) => setSettings({ ...settings, trackProductViews: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Add to Cart</div></div><ToggleSwitch checked={settings.trackAddToCart} onChange={(c) => setSettings({ ...settings, trackAddToCart: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Checkout</div></div><ToggleSwitch checked={settings.trackCheckout} onChange={(c) => setSettings({ ...settings, trackCheckout: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Purchase</div></div><ToggleSwitch checked={settings.trackPurchase} onChange={(c) => setSettings({ ...settings, trackPurchase: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Search</div></div><ToggleSwitch checked={settings.trackSearch} onChange={(c) => setSettings({ ...settings, trackSearch: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Wishlist</div></div><ToggleSwitch checked={settings.trackWishlist} onChange={(c) => setSettings({ ...settings, trackWishlist: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Sign Up</div></div><ToggleSwitch checked={settings.trackSignup} onChange={(c) => setSettings({ ...settings, trackSignup: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Login</div></div><ToggleSwitch checked={settings.trackLogin} onChange={(c) => setSettings({ ...settings, trackLogin: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'privacy' && (
                <SettingsSection title="Privacy & Consent" description="GDPR compliance" icon="🛡️">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Cookie Consent Required</div></div><ToggleSwitch checked={settings.enableCookieConsent} onChange={(c) => setSettings({ ...settings, enableCookieConsent: c })} /></div>
                    {settings.enableCookieConsent && <SettingsField label="Consent Mode"><AdminDropdown value={settings.consentMode} onChange={(v) => setSettings({ ...settings, consentMode: v })} options={[{ value: 'opt-in', label: 'Opt-in (GDPR)' }, { value: 'opt-out', label: 'Opt-out' }, { value: 'implied', label: 'Implied Consent' }]} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Anonymize IP</div></div><ToggleSwitch checked={settings.anonymizeIp} onChange={(c) => setSettings({ ...settings, anonymizeIp: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Respect Do-Not-Track</div></div><ToggleSwitch checked={settings.respectDoNotTrack} onChange={(c) => setSettings({ ...settings, respectDoNotTrack: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'reports' && (
                <SettingsSection title="Reports" description="Email and dashboard reports" icon="📊">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Dashboard Reports</div></div><ToggleSwitch checked={settings.enableDashboardReports} onChange={(c) => setSettings({ ...settings, enableDashboardReports: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Sales Reports</div></div><ToggleSwitch checked={settings.enableSalesReports} onChange={(c) => setSettings({ ...settings, enableSalesReports: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Product Reports</div></div><ToggleSwitch checked={settings.enableProductReports} onChange={(c) => setSettings({ ...settings, enableProductReports: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Customer Reports</div></div><ToggleSwitch checked={settings.enableCustomerReports} onChange={(c) => setSettings({ ...settings, enableCustomerReports: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Traffic Reports</div></div><ToggleSwitch checked={settings.enableTrafficReports} onChange={(c) => setSettings({ ...settings, enableTrafficReports: c })} /></div>
                    <SettingsField label="Email Frequency"><AdminDropdown value={settings.reportsEmailFrequency} onChange={(v) => setSettings({ ...settings, reportsEmailFrequency: v })} options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'never', label: 'Never' }]} /></SettingsField>
                    <SettingsField label="Reports Email"><input type="email" value={settings.reportsEmail} onChange={(e) => setSettings({ ...settings, reportsEmail: e.target.value })} placeholder="reports@example.com" /></SettingsField>
                </SettingsSection>
            )}

            {activeTab === 'custom' && (
                <SettingsSection title="Custom Scripts" description="Add custom tracking code" icon="📜">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Custom Scripts</div></div><ToggleSwitch checked={settings.enableCustomScripts} onChange={(c) => setSettings({ ...settings, enableCustomScripts: c })} /></div>
                    {settings.enableCustomScripts && (<>
                        <SettingsField label="Header Scripts" description="Added to &lt;head&gt;"><textarea value={settings.headerScripts} onChange={(e) => setSettings({ ...settings, headerScripts: e.target.value })} rows={4} placeholder="<!-- Your scripts here -->" /></SettingsField>
                        <SettingsField label="Body Start Scripts"><textarea value={settings.bodyStartScripts} onChange={(e) => setSettings({ ...settings, bodyStartScripts: e.target.value })} rows={4} /></SettingsField>
                        <SettingsField label="Body End Scripts"><textarea value={settings.bodyEndScripts} onChange={(e) => setSettings({ ...settings, bodyEndScripts: e.target.value })} rows={4} /></SettingsField>
                    </>)}
                </SettingsSection>
            )}

            <div className="settings-actions"><button className="admin-btn admin-btn-outline" onClick={() => { setSettings(defaultSettings); toast.info('Settings reset to default values'); }} type="button">Reset to Default</button><button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </div>
    );
}
