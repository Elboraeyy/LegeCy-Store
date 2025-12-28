"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import ImageUploader from '@/components/admin/settings/ImageUploader';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { toast } from 'sonner';

type GeneralSettings = {
    // Store Identity
    storeName: string;
    storeTagline: string;
    storeDescription: string;
    storeLogo: string;
    storeLogoDark: string;
    storeLogoSmall: string;
    storeFavicon: string;
    storeAppleTouchIcon: string;
    
    // Contact Information
    storeEmail: string;
    salesEmail: string;
    supportEmail: string;
    storePhone: string;
    whatsappNumber: string;
    secondaryPhone: string;
    faxNumber: string;
    
    // Address
    streetAddress: string;
    streetAddress2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude: string;
    longitude: string;
    
    // Regional Settings
    timezone: string;
    currency: string;
    currencyPosition: 'before' | 'after';
    currencySymbol: string;
    thousandsSeparator: string;
    decimalSeparator: string;
    decimalPlaces: number;
    
    // Legal Information
    businessName: string;
    businessType: string;
    taxId: string;
    commercialRegister: string;
    vatNumber: string;
    
    // Business Hours
    businessHoursEnabled: boolean;
    mondayOpen: string;
    mondayClose: string;
    tuesdayOpen: string;
    tuesdayClose: string;
    wednesdayOpen: string;
    wednesdayClose: string;
    thursdayOpen: string;
    thursdayClose: string;
    fridayOpen: string;
    fridayClose: string;
    saturdayOpen: string;
    saturdayClose: string;
    sundayOpen: string;
    sundayClose: string;
    
    // Store Status
    storeOpen: boolean;
    closedMessage: string;
    comingSoonMode: boolean;
    comingSoonDate: string;
    
    // Display Options
    showAddress: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showBusinessHours: boolean;
    showSocialLinks: boolean;
    showWhatsappWidget: boolean;
    showChatWidget: boolean;
};

const defaultSettings: GeneralSettings = {
    storeName: '',
    storeTagline: '',
    storeDescription: '',
    storeLogo: '',
    storeLogoDark: '',
    storeLogoSmall: '',
    storeFavicon: '',
    storeAppleTouchIcon: '',
    
    storeEmail: '',
    salesEmail: '',
    supportEmail: '',
    storePhone: '',
    whatsappNumber: '',
    secondaryPhone: '',
    faxNumber: '',
    
    streetAddress: '',
    streetAddress2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'EG',
    latitude: '',
    longitude: '',
    
    timezone: 'Africa/Cairo',
    currency: 'EGP',
    currencyPosition: 'before',
    currencySymbol: 'E£',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    decimalPlaces: 2,
    
    businessName: '',
    businessType: 'retail',
    taxId: '',
    commercialRegister: '',
    vatNumber: '',
    
    businessHoursEnabled: false,
    mondayOpen: '09:00',
    mondayClose: '21:00',
    tuesdayOpen: '09:00',
    tuesdayClose: '21:00',
    wednesdayOpen: '09:00',
    wednesdayClose: '21:00',
    thursdayOpen: '09:00',
    thursdayClose: '21:00',
    fridayOpen: '09:00',
    fridayClose: '21:00',
    saturdayOpen: '09:00',
    saturdayClose: '21:00',
    sundayOpen: '09:00',
    sundayClose: '21:00',
    
    storeOpen: true,
    closedMessage: 'We are currently closed. Please check back later.',
    comingSoonMode: false,
    comingSoonDate: '',
    
    showAddress: true,
    showPhone: true,
    showEmail: true,
    showBusinessHours: false,
    showSocialLinks: true,
    showWhatsappWidget: false,
    showChatWidget: false,
};

const timezones = [
    { value: 'Africa/Cairo', label: 'Cairo (GMT+2)' },
    { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' },
    { value: 'Asia/Riyadh', label: 'Riyadh (GMT+3)' },
    { value: 'Asia/Kuwait', label: 'Kuwait (GMT+3)' },
    { value: 'Asia/Amman', label: 'Amman (GMT+3)' },
    { value: 'Asia/Beirut', label: 'Beirut (GMT+2)' },
    { value: 'Europe/London', label: 'London (GMT+0)' },
    { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
    { value: 'America/New_York', label: 'New York (GMT-5)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
];

const currencies = [
    { value: 'EGP', label: 'Egyptian Pound (EGP)', symbol: 'E£' },
    { value: 'USD', label: 'US Dollar (USD)', symbol: '$' },
    { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
    { value: 'GBP', label: 'British Pound (GBP)', symbol: '£' },
    { value: 'SAR', label: 'Saudi Riyal (SAR)', symbol: '﷼' },
    { value: 'AED', label: 'UAE Dirham (AED)', symbol: 'د.إ' },
    { value: 'KWD', label: 'Kuwaiti Dinar (KWD)', symbol: 'د.ك' },
    { value: 'QAR', label: 'Qatari Riyal (QAR)', symbol: 'ر.ق' },
    { value: 'BHD', label: 'Bahraini Dinar (BHD)', symbol: '.د.ب' },
    { value: 'OMR', label: 'Omani Rial (OMR)', symbol: 'ر.ع' },
    { value: 'JOD', label: 'Jordanian Dinar (JOD)', symbol: 'د.ا' },
    { value: 'LBP', label: 'Lebanese Pound (LBP)', symbol: 'ل.ل' },
];

const countries = [
    { value: 'EG', label: 'Egypt' },
    { value: 'SA', label: 'Saudi Arabia' },
    { value: 'AE', label: 'United Arab Emirates' },
    { value: 'KW', label: 'Kuwait' },
    { value: 'QA', label: 'Qatar' },
    { value: 'BH', label: 'Bahrain' },
    { value: 'OM', label: 'Oman' },
    { value: 'JO', label: 'Jordan' },
    { value: 'LB', label: 'Lebanon' },
    { value: 'US', label: 'United States' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
];

const businessTypes = [
    { value: 'retail', label: 'Retail Store' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'ecommerce', label: 'E-commerce Only' },
    { value: 'dropshipping', label: 'Dropshipping' },
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'services', label: 'Services' },
    { value: 'digital', label: 'Digital Products' },
    { value: 'subscription', label: 'Subscription Business' },
];

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function GeneralSettingsPage() {
    const [settings, setSettings] = useState<GeneralSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('identity');

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('general_settings_v2');
                if (data) setSettings({ ...defaultSettings, ...(data as Partial<GeneralSettings>) });
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateStoreConfig('general_settings_v2', settings);
            toast.success('General settings saved!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'identity', label: 'Store Identity', icon: '🏪' },
        { id: 'contact', label: 'Contact', icon: '📞' },
        { id: 'address', label: 'Address', icon: '📍' },
        { id: 'regional', label: 'Regional', icon: '🌍' },
        { id: 'legal', label: 'Legal', icon: '📋' },
        { id: 'hours', label: 'Hours', icon: '🕐' },
        { id: 'status', label: 'Status', icon: '🚦' },
        { id: 'display', label: 'Display', icon: '👁️' },
    ];

    if (loading) {
        return (
            <div className="settings-loading">
                <div className="skeleton" style={{ height: '32px', width: '200px', marginBottom: '32px' }} />
                <div className="skeleton" style={{ height: '400px', borderRadius: '20px' }} />
            </div>
        );
    }

    return (
        <div>
            <div className="settings-page-header">
                <h1 className="settings-page-title">General Settings</h1>
                <p className="settings-page-description">
                    Complete store configuration with 70+ settings
                </p>
            </div>

            {/* Sub-tabs */}
            <div className="settings-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Store Identity Tab */}
            {activeTab === 'identity' && (
                <>
                    <SettingsSection
                        title="Store Name & Branding"
                        description="Your store's identity and branding"
                        icon="🏪"
                    >
                        <SettingsField label="Store Name" htmlFor="storeName" required>
                            <input
                                id="storeName"
                                type="text"
                                value={settings.storeName}
                                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                                placeholder="Legacy Store"
                            />
                        </SettingsField>

                        <SettingsField 
                            label="Store Tagline" 
                            htmlFor="storeTagline"
                            description="A short slogan or tagline for your store"
                        >
                            <input
                                id="storeTagline"
                                type="text"
                                value={settings.storeTagline}
                                onChange={(e) => setSettings({ ...settings, storeTagline: e.target.value })}
                                placeholder="Premium Leather Goods Since 2020"
                            />
                        </SettingsField>

                        <SettingsField 
                            label="Store Description" 
                            htmlFor="storeDescription"
                            description="A detailed description of your store (for SEO & about pages)"
                        >
                            <textarea
                                id="storeDescription"
                                value={settings.storeDescription}
                                onChange={(e) => setSettings({ ...settings, storeDescription: e.target.value })}
                                placeholder="We offer the finest handcrafted leather goods..."
                                rows={4}
                            />
                        </SettingsField>
                    </SettingsSection>

                    <SettingsSection
                        title="Logo & Icons"
                        description="Upload your store's visual assets"
                        icon="🖼️"
                    >
                        <div className="settings-grid">
                            <SettingsField 
                                label="Main Logo"
                                description="Primary logo (light background)"
                            >
                                <ImageUploader
                                    value={settings.storeLogo}
                                    onChange={(url) => setSettings({ ...settings, storeLogo: url })}
                                    aspectRatio="3/1"
                                    placeholder="Upload main logo (recommended: 300x100px)"
                                />
                            </SettingsField>

                            <SettingsField 
                                label="Dark Mode Logo"
                                description="Logo for dark backgrounds"
                            >
                                <ImageUploader
                                    value={settings.storeLogoDark}
                                    onChange={(url) => setSettings({ ...settings, storeLogoDark: url })}
                                    aspectRatio="3/1"
                                    placeholder="Upload dark mode logo"
                                />
                            </SettingsField>
                        </div>

                        <div className="settings-grid settings-grid-3">
                            <SettingsField 
                                label="Small Logo / Icon"
                                description="For mobile header (100x100px)"
                            >
                                <ImageUploader
                                    value={settings.storeLogoSmall}
                                    onChange={(url) => setSettings({ ...settings, storeLogoSmall: url })}
                                    aspectRatio="1/1"
                                    placeholder="Upload small logo"
                                />
                            </SettingsField>

                            <SettingsField 
                                label="Favicon"
                                description="Browser tab icon (32x32px)"
                            >
                                <ImageUploader
                                    value={settings.storeFavicon}
                                    onChange={(url) => setSettings({ ...settings, storeFavicon: url })}
                                    aspectRatio="1/1"
                                    placeholder="Upload favicon"
                                />
                            </SettingsField>

                            <SettingsField 
                                label="Apple Touch Icon"
                                description="iOS home screen (180x180px)"
                            >
                                <ImageUploader
                                    value={settings.storeAppleTouchIcon}
                                    onChange={(url) => setSettings({ ...settings, storeAppleTouchIcon: url })}
                                    aspectRatio="1/1"
                                    placeholder="Upload Apple touch icon"
                                />
                            </SettingsField>
                        </div>
                    </SettingsSection>
                </>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
                <SettingsSection
                    title="Contact Information"
                    description="All ways customers can reach you"
                    icon="📞"
                >
                    <div className="settings-grid">
                        <SettingsField label="Primary Email" htmlFor="storeEmail" required>
                            <input
                                id="storeEmail"
                                type="email"
                                value={settings.storeEmail}
                                onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
                                placeholder="contact@store.com"
                            />
                        </SettingsField>

                        <SettingsField label="Sales Email" htmlFor="salesEmail">
                            <input
                                id="salesEmail"
                                type="email"
                                value={settings.salesEmail}
                                onChange={(e) => setSettings({ ...settings, salesEmail: e.target.value })}
                                placeholder="sales@store.com"
                            />
                        </SettingsField>
                    </div>

                    <div className="settings-grid">
                        <SettingsField label="Support Email" htmlFor="supportEmail">
                            <input
                                id="supportEmail"
                                type="email"
                                value={settings.supportEmail}
                                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                placeholder="support@store.com"
                            />
                        </SettingsField>

                        <SettingsField label="Primary Phone" htmlFor="storePhone">
                            <input
                                id="storePhone"
                                type="tel"
                                value={settings.storePhone}
                                onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                                placeholder="+20 123 456 7890"
                            />
                        </SettingsField>
                    </div>

                    <div className="settings-grid">
                        <SettingsField 
                            label="WhatsApp Number" 
                            htmlFor="whatsappNumber"
                            description="Include country code"
                        >
                            <input
                                id="whatsappNumber"
                                type="tel"
                                value={settings.whatsappNumber}
                                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                                placeholder="+201234567890"
                            />
                        </SettingsField>

                        <SettingsField label="Secondary Phone" htmlFor="secondaryPhone">
                            <input
                                id="secondaryPhone"
                                type="tel"
                                value={settings.secondaryPhone}
                                onChange={(e) => setSettings({ ...settings, secondaryPhone: e.target.value })}
                                placeholder="+20 123 456 7891"
                            />
                        </SettingsField>
                    </div>

                    <SettingsField label="Fax Number" htmlFor="faxNumber">
                        <input
                            id="faxNumber"
                            type="tel"
                            value={settings.faxNumber}
                            onChange={(e) => setSettings({ ...settings, faxNumber: e.target.value })}
                            placeholder="+20 123 456 7892"
                            style={{ maxWidth: '300px' }}
                        />
                    </SettingsField>
                </SettingsSection>
            )}

            {/* Address Tab */}
            {activeTab === 'address' && (
                <SettingsSection
                    title="Store Address"
                    description="Physical location details"
                    icon="📍"
                >
                    <SettingsField label="Street Address" htmlFor="streetAddress">
                        <input
                            id="streetAddress"
                            type="text"
                            value={settings.streetAddress}
                            onChange={(e) => setSettings({ ...settings, streetAddress: e.target.value })}
                            placeholder="123 Main Street"
                        />
                    </SettingsField>

                    <SettingsField label="Street Address Line 2" htmlFor="streetAddress2">
                        <input
                            id="streetAddress2"
                            type="text"
                            value={settings.streetAddress2}
                            onChange={(e) => setSettings({ ...settings, streetAddress2: e.target.value })}
                            placeholder="Suite 100, Building A"
                        />
                    </SettingsField>

                    <div className="settings-grid">
                        <SettingsField label="City" htmlFor="city">
                            <input
                                id="city"
                                type="text"
                                value={settings.city}
                                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                                placeholder="Cairo"
                            />
                        </SettingsField>

                        <SettingsField label="State / Province" htmlFor="state">
                            <input
                                id="state"
                                type="text"
                                value={settings.state}
                                onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                                placeholder="Cairo Governorate"
                            />
                        </SettingsField>
                    </div>

                    <div className="settings-grid">
                        <SettingsField label="Postal / ZIP Code" htmlFor="postalCode">
                            <input
                                id="postalCode"
                                type="text"
                                value={settings.postalCode}
                                onChange={(e) => setSettings({ ...settings, postalCode: e.target.value })}
                                placeholder="12345"
                            />
                        </SettingsField>

                        <SettingsField label="Country" htmlFor="country">
                            <AdminDropdown
                                value={settings.country}
                                onChange={(v) => setSettings({ ...settings, country: v })}
                                options={countries}
                            />
                        </SettingsField>
                    </div>

                    <div className="settings-grid">
                        <SettingsField 
                            label="Latitude" 
                            htmlFor="latitude"
                            description="For Google Maps integration"
                        >
                            <input
                                id="latitude"
                                type="text"
                                value={settings.latitude}
                                onChange={(e) => setSettings({ ...settings, latitude: e.target.value })}
                                placeholder="30.0444"
                            />
                        </SettingsField>

                        <SettingsField 
                            label="Longitude" 
                            htmlFor="longitude"
                            description="For Google Maps integration"
                        >
                            <input
                                id="longitude"
                                type="text"
                                value={settings.longitude}
                                onChange={(e) => setSettings({ ...settings, longitude: e.target.value })}
                                placeholder="31.2357"
                            />
                        </SettingsField>
                    </div>
                </SettingsSection>
            )}

            {/* Regional Tab */}
            {activeTab === 'regional' && (
                <SettingsSection
                    title="Regional & Currency Settings"
                    description="Timezone and currency configuration"
                    icon="🌍"
                >
                    <div className="settings-grid">
                        <SettingsField label="Timezone" htmlFor="timezone">
                            <AdminDropdown
                                value={settings.timezone}
                                onChange={(v) => setSettings({ ...settings, timezone: v })}
                                options={timezones}
                            />
                        </SettingsField>

                        <SettingsField label="Currency" htmlFor="currency">
                            <AdminDropdown
                                value={settings.currency}
                                onChange={(v) => {
                                    const currency = currencies.find(c => c.value === v);
                                    setSettings({ 
                                        ...settings, 
                                        currency: v,
                                        currencySymbol: currency?.symbol || ''
                                    });
                                }}
                                options={currencies}
                            />
                        </SettingsField>
                    </div>

                    <div className="settings-grid">
                        <SettingsField label="Currency Symbol" htmlFor="currencySymbol">
                            <input
                                id="currencySymbol"
                                type="text"
                                value={settings.currencySymbol}
                                onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                                placeholder="E£"
                                style={{ maxWidth: '100px' }}
                            />
                        </SettingsField>

                        <SettingsField label="Currency Position" htmlFor="currencyPosition">
                            <AdminDropdown
                                value={settings.currencyPosition}
                                onChange={(v) => setSettings({ ...settings, currencyPosition: v as 'before' | 'after' })}
                                options={[{ value: 'before', label: 'Before amount (E£100)' }, { value: 'after', label: 'After amount (100 E£)' }]}
                            />
                        </SettingsField>
                    </div>

                    <div className="settings-grid settings-grid-3">
                        <SettingsField label="Thousands Separator" htmlFor="thousandsSeparator">
                            <AdminDropdown
                                value={settings.thousandsSeparator}
                                onChange={(v) => setSettings({ ...settings, thousandsSeparator: v })}
                                options={[{ value: ',', label: 'Comma (1,000)' }, { value: '.', label: 'Period (1.000)' }, { value: ' ', label: 'Space (1 000)' }, { value: '', label: 'None (1000)' }]}
                            />
                        </SettingsField>

                        <SettingsField label="Decimal Separator" htmlFor="decimalSeparator">
                            <AdminDropdown
                                value={settings.decimalSeparator}
                                onChange={(v) => setSettings({ ...settings, decimalSeparator: v })}
                                options={[{ value: '.', label: 'Period (.99)' }, { value: ',', label: 'Comma (,99)' }]}
                            />
                        </SettingsField>

                        <SettingsField label="Decimal Places" htmlFor="decimalPlaces">
                            <AdminDropdown
                                value={String(settings.decimalPlaces)}
                                onChange={(v) => setSettings({ ...settings, decimalPlaces: Number(v) })}
                                options={[{ value: '0', label: '0 (100)' }, { value: '1', label: '1 (100.0)' }, { value: '2', label: '2 (100.00)' }, { value: '3', label: '3 (100.000)' }]}
                            />
                        </SettingsField>
                    </div>
                </SettingsSection>
            )}

            {/* Legal Tab */}
            {activeTab === 'legal' && (
                <SettingsSection
                    title="Legal & Business Information"
                    description="Official business registration details"
                    icon="📋"
                >
                    <div className="settings-grid">
                        <SettingsField label="Registered Business Name" htmlFor="businessName">
                            <input
                                id="businessName"
                                type="text"
                                value={settings.businessName}
                                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                                placeholder="Legacy Trading Co. LLC"
                            />
                        </SettingsField>

                        <SettingsField label="Business Type" htmlFor="businessType">
                            <AdminDropdown
                                value={settings.businessType}
                                onChange={(v) => setSettings({ ...settings, businessType: v })}
                                options={businessTypes}
                            />
                        </SettingsField>
                    </div>

                    <div className="settings-grid">
                        <SettingsField label="Tax ID / TIN" htmlFor="taxId">
                            <input
                                id="taxId"
                                type="text"
                                value={settings.taxId}
                                onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                                placeholder="123-456-789"
                            />
                        </SettingsField>

                        <SettingsField label="Commercial Register Number" htmlFor="commercialRegister">
                            <input
                                id="commercialRegister"
                                type="text"
                                value={settings.commercialRegister}
                                onChange={(e) => setSettings({ ...settings, commercialRegister: e.target.value })}
                                placeholder="CR-12345"
                            />
                        </SettingsField>
                    </div>

                    <SettingsField label="VAT Number" htmlFor="vatNumber">
                        <input
                            id="vatNumber"
                            type="text"
                            value={settings.vatNumber}
                            onChange={(e) => setSettings({ ...settings, vatNumber: e.target.value })}
                            placeholder="VAT-123456789"
                            style={{ maxWidth: '300px' }}
                        />
                    </SettingsField>
                </SettingsSection>
            )}

            {/* Business Hours Tab */}
            {activeTab === 'hours' && (
                <SettingsSection
                    title="Business Hours"
                    description="Operating hours for your store"
                    icon="🕐"
                >
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Enable Business Hours</div>
                            <div className="settings-toggle-description">
                                Display operating hours on your website
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={settings.businessHoursEnabled}
                            onChange={(checked) => setSettings({ ...settings, businessHoursEnabled: checked })}
                        />
                    </div>

                    {settings.businessHoursEnabled && (
                        <div style={{ marginTop: '20px' }}>
                            {days.map((day) => (
                                <div key={day} className="settings-grid" style={{ marginBottom: '12px' }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        fontWeight: 500,
                                        textTransform: 'capitalize',
                                        minWidth: '100px'
                                    }}>
                                        {day}
                                    </div>
                                    <SettingsField label="Open">
                                        <input
                                            type="time"
                                            value={(settings as unknown as Record<string, string>)[`${day}Open`] || '09:00'}
                                            onChange={(e) => setSettings({ 
                                                ...settings, 
                                                [`${day}Open`]: e.target.value 
                                            } as GeneralSettings)}
                                        />
                                    </SettingsField>
                                    <SettingsField label="Close">
                                        <input
                                            type="time"
                                            value={(settings as unknown as Record<string, string>)[`${day}Close`] || '21:00'}
                                            onChange={(e) => setSettings({ 
                                                ...settings, 
                                                [`${day}Close`]: e.target.value 
                                            } as GeneralSettings)}
                                        />
                                    </SettingsField>
                                </div>
                            ))}
                        </div>
                    )}
                </SettingsSection>
            )}

            {/* Store Status Tab */}
            {activeTab === 'status' && (
                <SettingsSection
                    title="Store Status"
                    description="Control store availability"
                    icon="🚦"
                >
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Store Open</div>
                            <div className="settings-toggle-description">
                                When disabled, customers cannot place orders
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={settings.storeOpen}
                            onChange={(checked) => setSettings({ ...settings, storeOpen: checked })}
                            size="lg"
                        />
                    </div>

                    {!settings.storeOpen && (
                        <SettingsField 
                            label="Closed Message" 
                            htmlFor="closedMessage"
                            description="Message shown when store is closed"
                        >
                            <textarea
                                id="closedMessage"
                                value={settings.closedMessage}
                                onChange={(e) => setSettings({ ...settings, closedMessage: e.target.value })}
                                rows={3}
                            />
                        </SettingsField>
                    )}

                    <div className="settings-toggle-row" style={{ marginTop: '20px' }}>
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Coming Soon Mode</div>
                            <div className="settings-toggle-description">
                                Show a coming soon page instead of the store
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={settings.comingSoonMode}
                            onChange={(checked) => setSettings({ ...settings, comingSoonMode: checked })}
                        />
                    </div>

                    {settings.comingSoonMode && (
                        <SettingsField 
                            label="Launch Date" 
                            htmlFor="comingSoonDate"
                            description="Expected launch date"
                        >
                            <input
                                id="comingSoonDate"
                                type="datetime-local"
                                value={settings.comingSoonDate}
                                onChange={(e) => setSettings({ ...settings, comingSoonDate: e.target.value })}
                            />
                        </SettingsField>
                    )}
                </SettingsSection>
            )}

            {/* Display Tab */}
            {activeTab === 'display' && (
                <SettingsSection
                    title="Display Options"
                    description="Control what information is shown on your website"
                    icon="👁️"
                >
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Show Address in Footer</div>
                            <div className="settings-toggle-description">
                                Display your store address
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={settings.showAddress}
                            onChange={(checked) => setSettings({ ...settings, showAddress: checked })}
                        />
                    </div>

                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Show Phone Number</div>
                            <div className="settings-toggle-description">
                                Display phone number in header/footer
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={settings.showPhone}
                            onChange={(checked) => setSettings({ ...settings, showPhone: checked })}
                        />
                    </div>

                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Show Email Address</div>
                            <div className="settings-toggle-description">
                                Display email in contact section
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={settings.showEmail}
                            onChange={(checked) => setSettings({ ...settings, showEmail: checked })}
                        />
                    </div>

                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Show Business Hours</div>
                            <div className="settings-toggle-description">
                                Display operating hours
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={settings.showBusinessHours}
                            onChange={(checked) => setSettings({ ...settings, showBusinessHours: checked })}
                        />
                    </div>

                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Show Social Links</div>
                            <div className="settings-toggle-description">
                                Display social media icons
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={settings.showSocialLinks}
                            onChange={(checked) => setSettings({ ...settings, showSocialLinks: checked })}
                        />
                    </div>

                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Show WhatsApp Widget</div>
                            <div className="settings-toggle-description">
                                Floating WhatsApp contact button
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={settings.showWhatsappWidget}
                            onChange={(checked) => setSettings({ ...settings, showWhatsappWidget: checked })}
                        />
                    </div>

                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Show Live Chat Widget</div>
                            <div className="settings-toggle-description">
                                Floating live chat button
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={settings.showChatWidget}
                            onChange={(checked) => setSettings({ ...settings, showChatWidget: checked })}
                        />
                    </div>
                </SettingsSection>
            )}

            <div className="settings-actions">
                <button
                    className="admin-btn admin-btn-outline"
                    onClick={() => {
                        setSettings(defaultSettings);
                        toast.info('Settings reset to default values');
                    }}
                    type="button"
                >
                    Reset to Default
                </button>
                <button
                    className="admin-btn admin-btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
