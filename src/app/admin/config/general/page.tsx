"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import ImageUploader from '@/components/admin/settings/ImageUploader';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

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
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
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
            toast.success(t.config.general.save_success || 'General settings saved!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error(t.config.general.save_error || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'identity', label: t.config.general.tabs.identity, icon: '🏪' },
        { id: 'contact', label: t.config.general.tabs.contact, icon: '📞' },
        { id: 'address', label: t.config.general.tabs.address, icon: '📍' },
        { id: 'regional', label: t.config.general.tabs.regional, icon: '🌍' },
        { id: 'legal', label: t.config.general.tabs.legal, icon: '📋' },
        { id: 'hours', label: t.config.general.tabs.hours, icon: '🕐' },
        { id: 'status', label: t.config.general.tabs.status, icon: '🚦' },
        { id: 'display', label: t.config.general.tabs.display, icon: '👁️' },
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
                <h1 className="settings-page-title">{t.config.general.page_title}</h1>
                <p className="settings-page-description">
                    {t.config.general.page_desc}
                </p>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary"
                    style={{ marginLeft: 'auto' }}
                >
                    {saving ? t.promos.common.saving : t.promos.common.save}
                </button>
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
                        title={t.config.general.identity.title}
                        description={t.config.general.identity.desc}
                        icon="🏪"
                    >
                        <SettingsField label={t.config.general.identity.store_name} htmlFor="storeName" required>
                            <input
                                id="storeName"
                                type="text"
                                value={settings.storeName}
                                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                                placeholder="Legacy Store"
                            />
                        </SettingsField>

                        <SettingsField 
                            label={t.config.general.identity.tagline} 
                            htmlFor="storeTagline"
                            description={t.config.general.identity.tagline_desc}
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
                            label={t.config.general.identity.description} 
                            htmlFor="storeDescription"
                            description={t.config.general.identity.description_desc}
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
                        title={t.config.general.identity.logo_section.title}
                        description={t.config.general.identity.logo_section.desc}
                        icon="🖼️"
                    >
                        <div className="settings-grid">
                            <SettingsField 
                                label={t.config.general.identity.logo_section.main}
                                description={t.config.general.identity.logo_section.main_desc}
                            >
                                <ImageUploader
                                    value={settings.storeLogo}
                                    onChange={(url) => setSettings({ ...settings, storeLogo: url })}
                                    aspectRatio="3/1"
                                    placeholder="Upload main logo (recommended: 300x100px)"
                                />
                            </SettingsField>

                            <SettingsField 
                                label={t.config.general.identity.logo_section.dark}
                                description={t.config.general.identity.logo_section.dark_desc}
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
                                label={t.config.general.identity.logo_section.small}
                                description={t.config.general.identity.logo_section.small_desc}
                            >
                                <ImageUploader
                                    value={settings.storeLogoSmall}
                                    onChange={(url) => setSettings({ ...settings, storeLogoSmall: url })}
                                    aspectRatio="1/1"
                                    placeholder="Upload small logo"
                                />
                            </SettingsField>

                            <SettingsField 
                                label={t.config.general.identity.logo_section.favicon}
                                description={t.config.general.identity.logo_section.favicon_desc}
                            >
                                <ImageUploader
                                    value={settings.storeFavicon}
                                    onChange={(url) => setSettings({ ...settings, storeFavicon: url })}
                                    aspectRatio="1/1"
                                    placeholder="Upload favicon"
                                />
                            </SettingsField>

                            <SettingsField 
                                label={t.config.general.identity.logo_section.apple}
                                description={t.config.general.identity.logo_section.apple_desc}
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
                    title={t.config.general.contact.title}
                    description={t.config.general.contact.desc}
                    icon="📞"
                >
                    <div className="settings-grid">
                        <SettingsField label={t.config.general.contact.primary_email} htmlFor="storeEmail" required>
                            <input
                                id="storeEmail"
                                type="email"
                                value={settings.storeEmail}
                                onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
                                placeholder="contact@store.com"
                            />
                        </SettingsField>

                        <SettingsField label={t.config.general.contact.sales_email} htmlFor="salesEmail">
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
                        <SettingsField label={t.config.general.contact.support_email} htmlFor="supportEmail">
                            <input
                                id="supportEmail"
                                type="email"
                                value={settings.supportEmail}
                                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                placeholder="support@store.com"
                            />
                        </SettingsField>

                        <SettingsField label={t.config.general.contact.primary_phone} htmlFor="storePhone">
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
                            label={t.config.general.contact.whatsapp} 
                            htmlFor="whatsappNumber"
                            description={t.config.general.contact.whatsapp_desc}
                        >
                            <input
                                id="whatsappNumber"
                                type="tel"
                                value={settings.whatsappNumber}
                                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                                placeholder="+201234567890"
                            />
                        </SettingsField>

                        <SettingsField label={t.config.general.contact.secondary_phone} htmlFor="secondaryPhone">
                            <input
                                id="secondaryPhone"
                                type="tel"
                                value={settings.secondaryPhone}
                                onChange={(e) => setSettings({ ...settings, secondaryPhone: e.target.value })}
                                placeholder="+20 123 456 7891"
                            />
                        </SettingsField>
                    </div>

                    <SettingsField label={t.config.general.contact.fax} htmlFor="faxNumber">
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
                    title={t.config.general.address.title}
                    description={t.config.general.address.desc}
                    icon="📍"
                >
                    <SettingsField label={t.config.general.address.street} htmlFor="streetAddress">
                        <input
                            id="streetAddress"
                            type="text"
                            value={settings.streetAddress}
                            onChange={(e) => setSettings({ ...settings, streetAddress: e.target.value })}
                            placeholder="123 Main Street"
                        />
                    </SettingsField>

                    <SettingsField label={t.config.general.address.street2} htmlFor="streetAddress2">
                        <input
                            id="streetAddress2"
                            type="text"
                            value={settings.streetAddress2}
                            onChange={(e) => setSettings({ ...settings, streetAddress2: e.target.value })}
                            placeholder="Suite 100, Building A"
                        />
                    </SettingsField>

                    <div className="settings-grid">
                        <SettingsField label={t.config.general.address.city} htmlFor="city">
                            <input
                                id="city"
                                type="text"
                                value={settings.city}
                                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                                placeholder="Cairo"
                            />
                        </SettingsField>

                        <SettingsField label={t.config.general.address.state} htmlFor="state">
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
                        <SettingsField label={t.config.general.address.postal} htmlFor="postalCode">
                            <input
                                id="postalCode"
                                type="text"
                                value={settings.postalCode}
                                onChange={(e) => setSettings({ ...settings, postalCode: e.target.value })}
                                placeholder="12345"
                            />
                        </SettingsField>

                        <SettingsField label={t.config.general.address.country} htmlFor="country">
                            <AdminDropdown
                                value={settings.country}
                                onChange={(v) => setSettings({ ...settings, country: v })}
                                options={countries}
                            />
                        </SettingsField>
                    </div>

                    <div className="settings-grid">
                        <SettingsField 
                            label={t.config.general.address.latitude} 
                            htmlFor="latitude"
                            description={t.config.general.address.map_desc}
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
                            label={t.config.general.address.longitude} 
                            htmlFor="longitude"
                            description={t.config.general.address.map_desc}
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
                    title={t.config.general.regional.title}
                    description={t.config.general.regional.desc}
                    icon="🌍"
                >
                    <div className="settings-grid">
                        <SettingsField label={t.config.general.regional.timezone} htmlFor="timezone">
                            <AdminDropdown
                                value={settings.timezone}
                                onChange={(v) => setSettings({ ...settings, timezone: v })}
                                options={timezones}
                            />
                        </SettingsField>

                        <SettingsField label={t.config.general.regional.currency} htmlFor="currency">
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
                        <SettingsField label={t.config.general.regional.symbol} htmlFor="currencySymbol">
                            <input
                                id="currencySymbol"
                                type="text"
                                value={settings.currencySymbol}
                                onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                                placeholder="E£"
                                style={{ maxWidth: '100px' }}
                            />
                        </SettingsField>

                        <SettingsField label={t.config.general.regional.position} htmlFor="currencyPosition">
                            <AdminDropdown
                                value={settings.currencyPosition}
                                onChange={(v) => setSettings({ ...settings, currencyPosition: v as 'before' | 'after' })}
                                options={[{ value: 'before', label: 'Before amount (E£100)' }, { value: 'after', label: 'After amount (100 E£)' }]}
                            />
                        </SettingsField>
                    </div>

                    <div className="settings-grid settings-grid-3">
                        <SettingsField label={t.config.general.regional.thousands} htmlFor="thousandsSeparator">
                            <AdminDropdown
                                value={settings.thousandsSeparator}
                                onChange={(v) => setSettings({ ...settings, thousandsSeparator: v })}
                                options={[{ value: ',', label: 'Comma (1,000)' }, { value: '.', label: 'Period (1.000)' }, { value: ' ', label: 'Space (1 000)' }, { value: '', label: 'None (1000)' }]}
                            />
                        </SettingsField>

                        <SettingsField label={t.config.general.regional.decimal} htmlFor="decimalSeparator">
                            <AdminDropdown
                                value={settings.decimalSeparator}
                                onChange={(v) => setSettings({ ...settings, decimalSeparator: v })}
                                options={[{ value: '.', label: 'Period (.99)' }, { value: ',', label: 'Comma (,99)' }]}
                            />
                        </SettingsField>

                        <SettingsField label={t.config.general.regional.decimals} htmlFor="decimalPlaces">
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
                    title={t.config.general.legal.title}
                    description={t.config.general.legal.desc}
                    icon="📋"
                >
                    <div className="settings-grid">
                        <SettingsField label={t.config.general.legal.business_name} htmlFor="businessName">
                            <input
                                id="businessName"
                                type="text"
                                value={settings.businessName}
                                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                                placeholder="Legacy Trading Co. LLC"
                            />
                        </SettingsField>

                        <SettingsField label={t.config.general.legal.business_type} htmlFor="businessType">
                            <AdminDropdown
                                value={settings.businessType}
                                onChange={(v) => setSettings({ ...settings, businessType: v })}
                                options={businessTypes}
                            />
                        </SettingsField>
                    </div>

                    <div className="settings-grid">
                        <SettingsField label={t.config.general.legal.tax_id} htmlFor="taxId">
                            <input
                                id="taxId"
                                type="text"
                                value={settings.taxId}
                                onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                                placeholder="123-456-789"
                            />
                        </SettingsField>

                        <SettingsField label={t.config.general.legal.cr_number} htmlFor="commercialRegister">
                            <input
                                id="commercialRegister"
                                type="text"
                                value={settings.commercialRegister}
                                onChange={(e) => setSettings({ ...settings, commercialRegister: e.target.value })}
                                placeholder="CR-12345"
                            />
                        </SettingsField>
                    </div>

                    <SettingsField label={t.config.general.legal.vat_number} htmlFor="vatNumber">
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
                    title={t.config.general.hours.title}
                    description={t.config.general.hours.desc}
                    icon="🕐"
                >
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.general.hours.enable}</div>
                            <div className="settings-toggle-description">
                                {t.config.general.hours.enable_desc}
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
                                    <SettingsField label={t.config.general.hours.open}>
                                        <input
                                            type="time"
                                            value={(settings as unknown as Record<string, string>)[`${day}Open`] || '09:00'}
                                            onChange={(e) => setSettings({ 
                                                ...settings, 
                                                [`${day}Open`]: e.target.value 
                                            } as GeneralSettings)}
                                        />
                                    </SettingsField>
                                    <SettingsField label={t.config.general.hours.close}>
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
                    title={t.config.general.status.title}
                    description={t.config.general.status.desc}
                    icon="🚦"
                >
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.general.status.open}</div>
                            <div className="settings-toggle-description">
                                {t.config.general.status.open_desc}
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
                            label={t.config.general.status.closed_message}
                            htmlFor="closedMessage"
                            description={t.config.general.status.closed_desc}
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
                            <div className="settings-toggle-label">{t.config.general.status.coming_soon}</div>
                            <div className="settings-toggle-description">
                                {t.config.general.status.coming_soon_desc}
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={settings.comingSoonMode}
                            onChange={(checked) => setSettings({ ...settings, comingSoonMode: checked })}
                        />
                    </div>

                    {settings.comingSoonMode && (
                        <SettingsField 
                            label={t.config.general.status.launch_date}
                            htmlFor="comingSoonDate"
                            description={t.config.general.status.launch_desc}
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
                    title={t.config.general.display.title}
                    description={t.config.general.display.desc}
                    icon="👁️"
                >
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.general.display.address}</div>
                            <div className="settings-toggle-description">
                                {t.config.general.display.address_desc}
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={settings.showAddress}
                            onChange={(checked) => setSettings({ ...settings, showAddress: checked })}
                        />
                    </div>

                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.general.display.phone}</div>
                            <div className="settings-toggle-description">
                                {t.config.general.display.phone_desc}
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={settings.showPhone}
                            onChange={(checked) => setSettings({ ...settings, showPhone: checked })}
                        />
                    </div>

                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.general.display.email}</div>
                            <div className="settings-toggle-description">
                                {t.config.general.display.email_desc}
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={settings.showEmail}
                            onChange={(checked) => setSettings({ ...settings, showEmail: checked })}
                        />
                    </div>

                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.general.display.hours}</div>
                            <div className="settings-toggle-description">
                                {t.config.general.display.hours_desc}
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={settings.showBusinessHours}
                            onChange={(checked) => setSettings({ ...settings, showBusinessHours: checked })}
                        />
                    </div>

                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.general.display.social}</div>
                            <div className="settings-toggle-description">
                                {t.config.general.display.social_desc}
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={settings.showSocialLinks}
                            onChange={(checked) => setSettings({ ...settings, showSocialLinks: checked })}
                        />
                    </div>

                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.general.display.whatsapp}</div>
                            <div className="settings-toggle-description">
                                {t.config.general.display.whatsapp_desc}
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={settings.showWhatsappWidget}
                            onChange={(checked) => setSettings({ ...settings, showWhatsappWidget: checked })}
                        />
                    </div>

                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.general.display.chat}</div>
                            <div className="settings-toggle-description">
                                {t.config.general.display.chat_desc}
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
                        toast.info(t.config.general.reset_confirm);
                    }}
                    type="button"
                >
                    {t.config.general.reset}
                </button>
                <button
                    className="admin-btn admin-btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? t.config.general.saving : t.config.general.save}
                </button>
            </div>
        </div>
    );
}
