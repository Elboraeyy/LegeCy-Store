"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ColorPicker from '@/components/admin/settings/ColorPicker';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

type AppearanceSettings = {
    // Theme Colors
    primaryColor: string;
    primaryColorLight: string;
    primaryColorDark: string;
    secondaryColor: string;
    accentColor: string;
    accentColorHover: string;
    backgroundColor: string;
    surfaceColor: string;
    borderColor: string;
    
    // Text Colors
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textOnPrimary: string;
    textOnAccent: string;
    linkColor: string;
    linkHoverColor: string;
    
    // Status Colors
    successColor: string;
    warningColor: string;
    errorColor: string;
    infoColor: string;
    
    // Typography
    fontFamilyHeading: string;
    fontFamilyBody: string;
    fontFamilyMono: string;
    baseFontSize: number;
    headingFontWeight: number;
    bodyFontWeight: number;
    lineHeightBase: number;
    letterSpacing: string;
    
    // Spacing
    spacingUnit: number;
    containerMaxWidth: number;
    sectionPaddingY: number;
    cardPadding: number;
    
    // Border & Shape
    borderRadius: number;
    borderRadiusSmall: number;
    borderRadiusLarge: number;
    borderRadiusPill: boolean;
    borderWidth: number;
    
    // Shadows
    shadowsEnabled: boolean;
    shadowSmall: string;
    shadowMedium: string;
    shadowLarge: string;
    
    // Animations
    animationsEnabled: boolean;
    animationDuration: number;
    animationEasing: string;
    hoverEffects: boolean;
    
    // Dark Mode
    darkModeEnabled: boolean;
    darkModeDefault: boolean;
    darkModeScheduled: boolean;
    darkModeStartTime: string;
    darkModeEndTime: string;
    darkBackgroundColor: string;
    darkSurfaceColor: string;
    darkTextPrimary: string;
    darkTextSecondary: string;
    darkBorderColor: string;
    
    // Header Styles
    headerHeight: number;
    headerBackground: string;
    headerSticky: boolean;
    headerShadow: boolean;
    headerLogoMaxHeight: number;
    headerTextColor: string;
    
    // Footer Styles
    footerBackground: string;
    footerTextColor: string;
    footerLinkColor: string;
    footerColumns: number;
    footerShowNewsletter: boolean;
    footerShowSocial: boolean;
    footerShowPaymentIcons: boolean;
    footerCopyrightText: string;
    
    // Button Styles
    buttonPaddingX: number;
    buttonPaddingY: number;
    buttonFontSize: number;
    buttonFontWeight: number;
    buttonBorderRadius: number;
    buttonTextTransform: string;
    primaryButtonBg: string;
    primaryButtonText: string;
    primaryButtonHoverBg: string;
    secondaryButtonBg: string;
    secondaryButtonText: string;
    outlineButtonBorder: string;
    
    // Form Styles
    inputHeight: number;
    inputPaddingX: number;
    inputBorderRadius: number;
    inputBackground: string;
    inputBorderColor: string;
    inputFocusBorderColor: string;
    inputFocusShadow: boolean;
    inputLabelSize: number;
    inputPlaceholderColor: string;
    
    // Card Styles
    cardBackground: string;
    cardBorderColor: string;
    cardBorderRadius: number;
    cardShadow: boolean;
    cardHoverShadow: boolean;
    cardHoverTransform: boolean;
    
    // Product Card Specific
    productCardImageRatio: string;
    productCardShowQuickView: boolean;
    productCardShowWishlist: boolean;
    productCardShowRating: boolean;
    productCardShowBadges: boolean;
    productCardPriceSize: number;
    productCardTitleLines: number;
    
    // Custom CSS
    customCSSEnabled: boolean;
    customCSSHead: string;
    customCSSBody: string;
    customJSHead: string;
    customJSBody: string;
};

const defaultSettings: AppearanceSettings = {
    primaryColor: '#1a3c34',
    primaryColorLight: '#2d5a4a',
    primaryColorDark: '#102520',
    secondaryColor: '#FCF8F3',
    accentColor: '#d4af37',
    accentColorHover: '#c9a22e',
    backgroundColor: '#ffffff',
    surfaceColor: '#f8f8f6',
    borderColor: '#e5e5e0',
    
    textPrimary: '#1a1a1a',
    textSecondary: '#4a4a4a',
    textMuted: '#888888',
    textOnPrimary: '#ffffff',
    textOnAccent: '#1a3c34',
    linkColor: '#1a3c34',
    linkHoverColor: '#d4af37',
    
    successColor: '#16a34a',
    warningColor: '#d97706',
    errorColor: '#dc2626',
    infoColor: '#0284c7',
    
    fontFamilyHeading: 'Playfair Display',
    fontFamilyBody: 'Inter',
    fontFamilyMono: 'JetBrains Mono',
    baseFontSize: 16,
    headingFontWeight: 600,
    bodyFontWeight: 400,
    lineHeightBase: 1.6,
    letterSpacing: 'normal',
    
    spacingUnit: 8,
    containerMaxWidth: 1400,
    sectionPaddingY: 80,
    cardPadding: 24,
    
    borderRadius: 12,
    borderRadiusSmall: 8,
    borderRadiusLarge: 20,
    borderRadiusPill: false,
    borderWidth: 1,
    
    shadowsEnabled: true,
    shadowSmall: '0 1px 3px rgba(0,0,0,0.08)',
    shadowMedium: '0 4px 12px rgba(0,0,0,0.1)',
    shadowLarge: '0 10px 40px rgba(0,0,0,0.15)',
    
    animationsEnabled: true,
    animationDuration: 200,
    animationEasing: 'ease',
    hoverEffects: true,
    
    darkModeEnabled: false,
    darkModeDefault: false,
    darkModeScheduled: false,
    darkModeStartTime: '20:00',
    darkModeEndTime: '06:00',
    darkBackgroundColor: '#0f0f0f',
    darkSurfaceColor: '#1a1a1a',
    darkTextPrimary: '#ffffff',
    darkTextSecondary: '#a0a0a0',
    darkBorderColor: '#2a2a2a',
    
    headerHeight: 80,
    headerBackground: '#ffffff',
    headerSticky: true,
    headerShadow: true,
    headerLogoMaxHeight: 50,
    headerTextColor: '#1a1a1a',
    
    footerBackground: '#1a3c34',
    footerTextColor: '#ffffff',
    footerLinkColor: '#d4af37',
    footerColumns: 4,
    footerShowNewsletter: true,
    footerShowSocial: true,
    footerShowPaymentIcons: true,
    footerCopyrightText: '© 2025 Legacy Store. All rights reserved.',
    
    buttonPaddingX: 24,
    buttonPaddingY: 12,
    buttonFontSize: 14,
    buttonFontWeight: 600,
    buttonBorderRadius: 99,
    buttonTextTransform: 'uppercase',
    primaryButtonBg: '#1a3c34',
    primaryButtonText: '#ffffff',
    primaryButtonHoverBg: '#2d5a4a',
    secondaryButtonBg: '#FCF8F3',
    secondaryButtonText: '#1a3c34',
    outlineButtonBorder: '#1a3c34',
    
    inputHeight: 48,
    inputPaddingX: 16,
    inputBorderRadius: 12,
    inputBackground: '#ffffff',
    inputBorderColor: '#e5e5e0',
    inputFocusBorderColor: '#d4af37',
    inputFocusShadow: true,
    inputLabelSize: 13,
    inputPlaceholderColor: '#999999',
    
    cardBackground: '#ffffff',
    cardBorderColor: '#e5e5e0',
    cardBorderRadius: 16,
    cardShadow: true,
    cardHoverShadow: true,
    cardHoverTransform: true,
    
    productCardImageRatio: '4/5',
    productCardShowQuickView: true,
    productCardShowWishlist: true,
    productCardShowRating: true,
    productCardShowBadges: true,
    productCardPriceSize: 18,
    productCardTitleLines: 2,
    
    customCSSEnabled: false,
    customCSSHead: '',
    customCSSBody: '',
    customJSHead: '',
    customJSBody: '',
};

const fontOptions = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Playfair Display', label: 'Playfair Display' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Lora', label: 'Lora' },
    { value: 'Merriweather', label: 'Merriweather' },
    { value: 'Raleway', label: 'Raleway' },
    { value: 'Nunito', label: 'Nunito' },
    { value: 'Cairo', label: 'Cairo (Arabic)' },
    { value: 'Tajawal', label: 'Tajawal (Arabic)' },
    { value: 'Almarai', label: 'Almarai (Arabic)' },
];

export default function AppearanceSettingsPage() {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const [settings, setSettings] = useState<AppearanceSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('colors');

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('appearance_settings_v2');
                if (data) setSettings({ ...defaultSettings, ...(data as Partial<AppearanceSettings>) });
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
            await updateStoreConfig('appearance_settings_v2', settings);
            toast.success(t.config.appearance.save_success || 'Appearance settings saved!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error(t.config.appearance.save_error || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'colors', label: t.config.appearance.tabs.colors, icon: '🎨' },
        { id: 'typography', label: t.config.appearance.tabs.typography, icon: '✍️' },
        { id: 'layout', label: t.config.appearance.tabs.layout, icon: '📐' },
        { id: 'effects', label: t.config.appearance.tabs.effects, icon: '✨' },
        { id: 'darkmode', label: t.config.appearance.tabs.darkmode, icon: '🌙' },
        { id: 'header', label: t.config.appearance.tabs.header, icon: '🔝' },
        { id: 'footer', label: t.config.appearance.tabs.footer, icon: '🔻' },
        { id: 'buttons', label: t.config.appearance.tabs.buttons, icon: '🔘' },
        { id: 'forms', label: t.config.appearance.tabs.forms, icon: '📝' },
        { id: 'cards', label: t.config.appearance.tabs.cards, icon: '🃏' },
        { id: 'products', label: t.config.appearance.tabs.products, icon: '🛍️' },
        { id: 'custom', label: t.config.appearance.tabs.custom, icon: '💻' },
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
                <h1 className="settings-page-title">{t.config.appearance.page_title}</h1>
                <p className="settings-page-description">
                    {t.config.appearance.page_desc}
                </p>
            </div>

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

            {/* Colors Tab */}
            {activeTab === 'colors' && (
                <>
                    <SettingsSection title={t.config.appearance.colors.title} description={t.config.appearance.colors.desc} icon="🎨">
                        <div className="settings-grid settings-grid-3">
                            <SettingsField label={t.config.appearance.colors.primary}>
                                <ColorPicker
                                    value={settings.primaryColor}
                                    onChange={(color) => setSettings({ ...settings, primaryColor: color })}
                                />
                            </SettingsField>
                            <SettingsField label={t.config.appearance.colors.primary_light}>
                                <ColorPicker
                                    value={settings.primaryColorLight}
                                    onChange={(color) => setSettings({ ...settings, primaryColorLight: color })}
                                />
                            </SettingsField>
                            <SettingsField label={t.config.appearance.colors.primary_dark}>
                                <ColorPicker
                                    value={settings.primaryColorDark}
                                    onChange={(color) => setSettings({ ...settings, primaryColorDark: color })}
                                />
                            </SettingsField>
                        </div>
                        <div className="settings-grid settings-grid-3">
                            <SettingsField label={t.config.appearance.colors.secondary}>
                                <ColorPicker
                                    value={settings.secondaryColor}
                                    onChange={(color) => setSettings({ ...settings, secondaryColor: color })}
                                />
                            </SettingsField>
                            <SettingsField label={t.config.appearance.colors.accent}>
                                <ColorPicker
                                    value={settings.accentColor}
                                    onChange={(color) => setSettings({ ...settings, accentColor: color })}
                                />
                            </SettingsField>
                            <SettingsField label={t.config.appearance.colors.accent_hover}>
                                <ColorPicker
                                    value={settings.accentColorHover}
                                    onChange={(color) => setSettings({ ...settings, accentColorHover: color })}
                                />
                            </SettingsField>
                        </div>
                    </SettingsSection>

                    <SettingsSection title={t.config.appearance.colors.background.title} description={t.config.appearance.colors.background.desc} icon="📄">
                        <div className="settings-grid settings-grid-3">
                            <SettingsField label={t.config.appearance.colors.background.bg}>
                                <ColorPicker
                                    value={settings.backgroundColor}
                                    onChange={(color) => setSettings({ ...settings, backgroundColor: color })}
                                />
                            </SettingsField>
                            <SettingsField label={t.config.appearance.colors.background.surface}>
                                <ColorPicker
                                    value={settings.surfaceColor}
                                    onChange={(color) => setSettings({ ...settings, surfaceColor: color })}
                                />
                            </SettingsField>
                            <SettingsField label={t.config.appearance.colors.background.border}>
                                <ColorPicker
                                    value={settings.borderColor}
                                    onChange={(color) => setSettings({ ...settings, borderColor: color })}
                                />
                            </SettingsField>
                        </div>
                    </SettingsSection>

                    <SettingsSection title={t.config.appearance.colors.text.title} description={t.config.appearance.colors.text.desc} icon="🔤">
                        <div className="settings-grid settings-grid-3">
                            <SettingsField label={t.config.appearance.colors.text.primary}>
                                <ColorPicker
                                    value={settings.textPrimary}
                                    onChange={(color) => setSettings({ ...settings, textPrimary: color })}
                                />
                            </SettingsField>
                            <SettingsField label={t.config.appearance.colors.text.secondary}>
                                <ColorPicker
                                    value={settings.textSecondary}
                                    onChange={(color) => setSettings({ ...settings, textSecondary: color })}
                                />
                            </SettingsField>
                            <SettingsField label={t.config.appearance.colors.text.muted}>
                                <ColorPicker
                                    value={settings.textMuted}
                                    onChange={(color) => setSettings({ ...settings, textMuted: color })}
                                />
                            </SettingsField>
                        </div>
                        <div className="settings-grid">
                            <SettingsField label={t.config.appearance.colors.text.link}>
                                <ColorPicker
                                    value={settings.linkColor}
                                    onChange={(color) => setSettings({ ...settings, linkColor: color })}
                                />
                            </SettingsField>
                            <SettingsField label={t.config.appearance.colors.text.link_hover}>
                                <ColorPicker
                                    value={settings.linkHoverColor}
                                    onChange={(color) => setSettings({ ...settings, linkHoverColor: color })}
                                />
                            </SettingsField>
                        </div>
                    </SettingsSection>

                    <SettingsSection title={t.config.appearance.colors.status.title} description={t.config.appearance.colors.status.desc} icon="🚦">
                        <div className="settings-grid settings-grid-3">
                            <SettingsField label={t.config.appearance.colors.status.success}>
                                <ColorPicker
                                    value={settings.successColor}
                                    onChange={(color) => setSettings({ ...settings, successColor: color })}
                                />
                            </SettingsField>
                            <SettingsField label={t.config.appearance.colors.status.warning}>
                                <ColorPicker
                                    value={settings.warningColor}
                                    onChange={(color) => setSettings({ ...settings, warningColor: color })}
                                />
                            </SettingsField>
                            <SettingsField label={t.config.appearance.colors.status.error}>
                                <ColorPicker
                                    value={settings.errorColor}
                                    onChange={(color) => setSettings({ ...settings, errorColor: color })}
                                />
                            </SettingsField>
                        </div>
                    </SettingsSection>
                </>
            )}

            {/* Typography Tab */}
            {activeTab === 'typography' && (
                <SettingsSection title={t.config.appearance.typography.title} description={t.config.appearance.typography.desc} icon="✍️">
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label={t.config.appearance.typography.heading_font}>
                            <AdminDropdown
                                value={settings.fontFamilyHeading}
                                onChange={(v) => setSettings({ ...settings, fontFamilyHeading: v })}
                                options={fontOptions}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.typography.body_font}>
                            <AdminDropdown
                                value={settings.fontFamilyBody}
                                onChange={(v) => setSettings({ ...settings, fontFamilyBody: v })}
                                options={fontOptions}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.typography.mono_font}>
                            <AdminDropdown
                                value={settings.fontFamilyMono}
                                onChange={(v) => setSettings({ ...settings, fontFamilyMono: v })}
                                options={[
                                    { value: 'JetBrains Mono', label: 'JetBrains Mono' },
                                    { value: 'Fira Code', label: 'Fira Code' },
                                    { value: 'Source Code Pro', label: 'Source Code Pro' },
                                    { value: 'Roboto Mono', label: 'Roboto Mono' }
                                ]}
                            />
                        </SettingsField>
                    </div>
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label={t.config.appearance.typography.base_size}>
                            <input
                                type="number"
                                value={settings.baseFontSize}
                                onChange={(e) => setSettings({ ...settings, baseFontSize: Number(e.target.value) })}
                                min={12}
                                max={24}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.typography.heading_weight}>
                            <AdminDropdown
                                value={settings.headingFontWeight.toString()}
                                onChange={(v) => setSettings({ ...settings, headingFontWeight: Number(v) })}
                                options={[
                                    { value: '400', label: 'Normal (400)' },
                                    { value: '500', label: 'Medium (500)' },
                                    { value: '600', label: 'Semibold (600)' },
                                    { value: '700', label: 'Bold (700)' },
                                    { value: '800', label: 'Extra Bold (800)' }
                                ]}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.typography.body_weight}>
                            <AdminDropdown
                                value={settings.bodyFontWeight.toString()}
                                onChange={(v) => setSettings({ ...settings, bodyFontWeight: Number(v) })}
                                options={[
                                    { value: '300', label: 'Light (300)' },
                                    { value: '400', label: 'Normal (400)' },
                                    { value: '500', label: 'Medium (500)' }
                                ]}
                            />
                        </SettingsField>
                    </div>
                    <div className="settings-grid">
                        <SettingsField label={t.config.appearance.typography.line_height}>
                            <AdminDropdown
                                value={settings.lineHeightBase.toString()}
                                onChange={(v) => setSettings({ ...settings, lineHeightBase: Number(v) })}
                                options={[
                                    { value: '1.4', label: 'Tight (1.4)' },
                                    { value: '1.5', label: 'Normal (1.5)' },
                                    { value: '1.6', label: 'Comfortable (1.6)' },
                                    { value: '1.8', label: 'Relaxed (1.8)' }
                                ]}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.typography.letter_spacing}>
                            <AdminDropdown
                                value={settings.letterSpacing}
                                onChange={(v) => setSettings({ ...settings, letterSpacing: v })}
                                options={[
                                    { value: '-0.02em', label: 'Tight' },
                                    { value: 'normal', label: 'Normal' },
                                    { value: '0.02em', label: 'Wide' },
                                    { value: '0.05em', label: 'Extra Wide' }
                                ]}
                            />
                        </SettingsField>
                    </div>
                </SettingsSection>
            )}

            {/* Layout Tab */}
            {activeTab === 'layout' && (
                <>
                    <SettingsSection title={t.config.appearance.layout.spacing.title} description={t.config.appearance.layout.spacing.desc} icon="📐">
                        <div className="settings-grid settings-grid-3">
                            <SettingsField label={t.config.appearance.layout.spacing.unit}>
                                <input
                                    type="number"
                                    value={settings.spacingUnit}
                                    onChange={(e) => setSettings({ ...settings, spacingUnit: Number(e.target.value) })}
                                    min={4}
                                    max={16}
                                />
                            </SettingsField>
                            <SettingsField label={t.config.appearance.layout.spacing.container}>
                                <input
                                    type="number"
                                    value={settings.containerMaxWidth}
                                    onChange={(e) => setSettings({ ...settings, containerMaxWidth: Number(e.target.value) })}
                                    min={1000}
                                    max={2000}
                                />
                            </SettingsField>
                            <SettingsField label={t.config.appearance.layout.spacing.section_padding}>
                                <input
                                    type="number"
                                    value={settings.sectionPaddingY}
                                    onChange={(e) => setSettings({ ...settings, sectionPaddingY: Number(e.target.value) })}
                                    min={20}
                                    max={150}
                                />
                            </SettingsField>
                        </div>
                    </SettingsSection>

                    <SettingsSection title={t.config.appearance.layout.borders.title} description={t.config.appearance.layout.borders.desc} icon="⬡">
                        <div className="settings-grid settings-grid-3">
                            <SettingsField label={t.config.appearance.layout.borders.radius}>
                                <input
                                    type="number"
                                    value={settings.borderRadius}
                                    onChange={(e) => setSettings({ ...settings, borderRadius: Number(e.target.value) })}
                                    min={0}
                                    max={50}
                                />
                            </SettingsField>
                            <SettingsField label={t.config.appearance.layout.borders.small_radius}>
                                <input
                                    type="number"
                                    value={settings.borderRadiusSmall}
                                    onChange={(e) => setSettings({ ...settings, borderRadiusSmall: Number(e.target.value) })}
                                    min={0}
                                    max={30}
                                />
                            </SettingsField>
                            <SettingsField label={t.config.appearance.layout.borders.large_radius}>
                                <input
                                    type="number"
                                    value={settings.borderRadiusLarge}
                                    onChange={(e) => setSettings({ ...settings, borderRadiusLarge: Number(e.target.value) })}
                                    min={0}
                                    max={100}
                                />
                            </SettingsField>
                        </div>
                        <div className="settings-grid">
                            <SettingsField label={t.config.appearance.layout.borders.width}>
                                <input
                                    type="number"
                                    value={settings.borderWidth}
                                    onChange={(e) => setSettings({ ...settings, borderWidth: Number(e.target.value) })}
                                    min={0}
                                    max={5}
                                />
                            </SettingsField>
                        </div>
                        <div className="settings-toggle-row">
                            <div className="settings-toggle-info">
                                <div className="settings-toggle-label">{t.config.appearance.layout.borders.pills}</div>
                                <div className="settings-toggle-description">{t.config.appearance.layout.borders.pills_desc}</div>
                            </div>
                            <ToggleSwitch
                                checked={settings.borderRadiusPill}
                                onChange={(checked) => setSettings({ ...settings, borderRadiusPill: checked })}
                            />
                        </div>
                    </SettingsSection>
                </>
            )}

            {/* Effects Tab */}
            {activeTab === 'effects' && (
                <>
                    <SettingsSection title={t.config.appearance.effects.shadows.title} description={t.config.appearance.effects.shadows.desc} icon="🌑">
                        <div className="settings-toggle-row">
                            <div className="settings-toggle-info">
                                <div className="settings-toggle-label">{t.config.appearance.effects.shadows.enable}</div>
                                <div className="settings-toggle-description">{t.config.appearance.effects.shadows.enable_desc}</div>
                            </div>
                            <ToggleSwitch
                                checked={settings.shadowsEnabled}
                                onChange={(checked) => setSettings({ ...settings, shadowsEnabled: checked })}
                            />
                        </div>
                        {settings.shadowsEnabled && (
                            <>
                                <SettingsField label={t.config.appearance.effects.shadows.small}>
                                    <input
                                        type="text"
                                        value={settings.shadowSmall}
                                        onChange={(e) => setSettings({ ...settings, shadowSmall: e.target.value })}
                                    />
                                </SettingsField>
                                <SettingsField label={t.config.appearance.effects.shadows.medium}>
                                    <input
                                        type="text"
                                        value={settings.shadowMedium}
                                        onChange={(e) => setSettings({ ...settings, shadowMedium: e.target.value })}
                                    />
                                </SettingsField>
                                <SettingsField label={t.config.appearance.effects.shadows.large}>
                                    <input
                                        type="text"
                                        value={settings.shadowLarge}
                                        onChange={(e) => setSettings({ ...settings, shadowLarge: e.target.value })}
                                    />
                                </SettingsField>
                            </>
                        )}
                    </SettingsSection>

                    <SettingsSection title={t.config.appearance.effects.animations.title} description={t.config.appearance.effects.animations.desc} icon="✨">
                        <div className="settings-toggle-row">
                            <div className="settings-toggle-info">
                                <div className="settings-toggle-label">{t.config.appearance.effects.animations.enable}</div>
                                <div className="settings-toggle-description">{t.config.appearance.effects.animations.enable_desc}</div>
                            </div>
                            <ToggleSwitch
                                checked={settings.animationsEnabled}
                                onChange={(checked) => setSettings({ ...settings, animationsEnabled: checked })}
                            />
                        </div>
                        {settings.animationsEnabled && (
                            <>
                                <div className="settings-grid">
                                    <SettingsField label={t.config.appearance.effects.animations.duration}>
                                        <input
                                            type="number"
                                            value={settings.animationDuration}
                                            onChange={(e) => setSettings({ ...settings, animationDuration: Number(e.target.value) })}
                                            min={100}
                                            max={1000}
                                        />
                                    </SettingsField>
                                    <SettingsField label={t.config.appearance.effects.animations.easing}>
                                        <AdminDropdown
                                            value={settings.animationEasing}
                                            onChange={(v) => setSettings({ ...settings, animationEasing: v })}
                                            options={[
                                                { value: 'ease', label: 'Ease' },
                                                { value: 'ease-in', label: 'Ease In' },
                                                { value: 'ease-out', label: 'Ease Out' },
                                                { value: 'ease-in-out', label: 'Ease In Out' },
                                                { value: 'linear', label: 'Linear' }
                                            ]}
                                        />
                                    </SettingsField>
                                </div>
                                <div className="settings-toggle-row">
                                    <div className="settings-toggle-info">
                                        <div className="settings-toggle-label">{t.config.appearance.effects.animations.hover}</div>
                                        <div className="settings-toggle-description">{t.config.appearance.effects.animations.hover_desc}</div>
                                    </div>
                                    <ToggleSwitch
                                        checked={settings.hoverEffects}
                                        onChange={(checked) => setSettings({ ...settings, hoverEffects: checked })}
                                    />
                                </div>
                            </>
                        )}
                    </SettingsSection>
                </>
            )}

            {/* Dark Mode Tab */}
            {activeTab === 'darkmode' && (
                <SettingsSection title="Dark Mode" description="Dark theme configuration" icon="🌙">
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Enable Dark Mode</div>
                            <div className="settings-toggle-description">Allow users to switch to dark theme</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.darkModeEnabled}
                            onChange={(checked) => setSettings({ ...settings, darkModeEnabled: checked })}
                        />
                    </div>
                    {settings.darkModeEnabled && (
                        <>
                            <div className="settings-toggle-row">
                                <div className="settings-toggle-info">
                                    <div className="settings-toggle-label">{t.config.appearance.darkmode.default}</div>
                                    <div className="settings-toggle-description">{t.config.appearance.darkmode.default_desc}</div>
                                </div>
                                <ToggleSwitch
                                    checked={settings.darkModeDefault}
                                    onChange={(checked) => setSettings({ ...settings, darkModeDefault: checked })}
                                />
                            </div>
                            <div className="settings-toggle-row">
                                <div className="settings-toggle-info">
                                    <div className="settings-toggle-label">{t.config.appearance.darkmode.scheduled}</div>
                                    <div className="settings-toggle-description">{t.config.appearance.darkmode.scheduled_desc}</div>
                                </div>
                                <ToggleSwitch
                                    checked={settings.darkModeScheduled}
                                    onChange={(checked) => setSettings({ ...settings, darkModeScheduled: checked })}
                                />
                            </div>
                            {settings.darkModeScheduled && (
                                <div className="settings-grid">
                                    <SettingsField label={t.config.appearance.darkmode.start_time}>
                                        <input
                                            type="time"
                                            value={settings.darkModeStartTime}
                                            onChange={(e) => setSettings({ ...settings, darkModeStartTime: e.target.value })}
                                        />
                                    </SettingsField>
                                    <SettingsField label={t.config.appearance.darkmode.end_time}>
                                        <input
                                            type="time"
                                            value={settings.darkModeEndTime}
                                            onChange={(e) => setSettings({ ...settings, darkModeEndTime: e.target.value })}
                                        />
                                    </SettingsField>
                                </div>
                            )}
                            <div style={{ marginTop: '20px' }}>
                                <h4 style={{ marginBottom: '16px', fontWeight: 600 }}>{t.config.appearance.darkmode.colors_title}</h4>
                                <div className="settings-grid settings-grid-3">
                                    <SettingsField label={t.config.appearance.darkmode.bg}>
                                        <ColorPicker
                                            value={settings.darkBackgroundColor}
                                            onChange={(color) => setSettings({ ...settings, darkBackgroundColor: color })}
                                        />
                                    </SettingsField>
                                    <SettingsField label={t.config.appearance.darkmode.surface}>
                                        <ColorPicker
                                            value={settings.darkSurfaceColor}
                                            onChange={(color) => setSettings({ ...settings, darkSurfaceColor: color })}
                                        />
                                    </SettingsField>
                                    <SettingsField label={t.config.appearance.darkmode.border}>
                                        <ColorPicker
                                            value={settings.darkBorderColor}
                                            onChange={(color) => setSettings({ ...settings, darkBorderColor: color })}
                                        />
                                    </SettingsField>
                                </div>
                                <div className="settings-grid">
                                    <SettingsField label={t.config.appearance.darkmode.text_primary}>
                                        <ColorPicker
                                            value={settings.darkTextPrimary}
                                            onChange={(color) => setSettings({ ...settings, darkTextPrimary: color })}
                                        />
                                    </SettingsField>
                                    <SettingsField label={t.config.appearance.darkmode.text_secondary}>
                                        <ColorPicker
                                            value={settings.darkTextSecondary}
                                            onChange={(color) => setSettings({ ...settings, darkTextSecondary: color })}
                                        />
                                    </SettingsField>
                                </div>
                            </div>
                        </>
                    )}
                </SettingsSection>
            )}

            {/* Header Tab */}
            {activeTab === 'header' && (
                <SettingsSection title={t.config.appearance.header.title} description={t.config.appearance.header.desc} icon="🔝">
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label={t.config.appearance.header.height}>
                            <input
                                type="number"
                                value={settings.headerHeight}
                                onChange={(e) => setSettings({ ...settings, headerHeight: Number(e.target.value) })}
                                min={50}
                                max={150}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.header.logo_height}>
                            <input
                                type="number"
                                value={settings.headerLogoMaxHeight}
                                onChange={(e) => setSettings({ ...settings, headerLogoMaxHeight: Number(e.target.value) })}
                                min={20}
                                max={100}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.header.bg}>
                            <ColorPicker
                                value={settings.headerBackground}
                                onChange={(color) => setSettings({ ...settings, headerBackground: color })}
                            />
                        </SettingsField>
                    </div>
                    <SettingsField label={t.config.appearance.header.text}>
                        <ColorPicker
                            value={settings.headerTextColor}
                            onChange={(color) => setSettings({ ...settings, headerTextColor: color })}
                        />
                    </SettingsField>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.appearance.header.sticky}</div>
                            <div className="settings-toggle-description">{t.config.appearance.header.sticky_desc}</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.headerSticky}
                            onChange={(checked) => setSettings({ ...settings, headerSticky: checked })}
                        />
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.appearance.header.shadow}</div>
                            <div className="settings-toggle-description">{t.config.appearance.header.shadow_desc}</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.headerShadow}
                            onChange={(checked) => setSettings({ ...settings, headerShadow: checked })}
                        />
                    </div>
                </SettingsSection>
            )}

            {/* Footer Tab */}
            {activeTab === 'footer' && (
                <SettingsSection title={t.config.appearance.footer.title} description={t.config.appearance.footer.desc} icon="🔻">
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label={t.config.appearance.footer.bg}>
                            <ColorPicker
                                value={settings.footerBackground}
                                onChange={(color) => setSettings({ ...settings, footerBackground: color })}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.footer.text}>
                            <ColorPicker
                                value={settings.footerTextColor}
                                onChange={(color) => setSettings({ ...settings, footerTextColor: color })}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.footer.link}>
                            <ColorPicker
                                value={settings.footerLinkColor}
                                onChange={(color) => setSettings({ ...settings, footerLinkColor: color })}
                            />
                        </SettingsField>
                    </div>
                    <SettingsField label={t.config.appearance.footer.columns}>
                        <AdminDropdown
                            value={settings.footerColumns.toString()}
                            onChange={(v) => setSettings({ ...settings, footerColumns: Number(v) })}
                            options={[
                                { value: '2', label: '2 Columns' },
                                { value: '3', label: '3 Columns' },
                                { value: '4', label: '4 Columns' },
                                { value: '5', label: '5 Columns' }
                            ]}
                        />
                    </SettingsField>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.appearance.footer.newsletter}</div>
                            <div className="settings-toggle-description">{t.config.appearance.footer.newsletter_desc}</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.footerShowNewsletter}
                            onChange={(checked) => setSettings({ ...settings, footerShowNewsletter: checked })}
                        />
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.appearance.footer.social}</div>
                            <div className="settings-toggle-description">{t.config.appearance.footer.social_desc}</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.footerShowSocial}
                            onChange={(checked) => setSettings({ ...settings, footerShowSocial: checked })}
                        />
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.appearance.footer.payment}</div>
                            <div className="settings-toggle-description">{t.config.appearance.footer.payment_desc}</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.footerShowPaymentIcons}
                            onChange={(checked) => setSettings({ ...settings, footerShowPaymentIcons: checked })}
                        />
                    </div>
                    <SettingsField label={t.config.appearance.footer.copyright}>
                        <input
                            type="text"
                            value={settings.footerCopyrightText}
                            onChange={(e) => setSettings({ ...settings, footerCopyrightText: e.target.value })}
                        />
                    </SettingsField>
                </SettingsSection>
            )}

            {/* Buttons Tab */}
            {activeTab === 'buttons' && (
                <SettingsSection title={t.config.appearance.buttons.title} description={t.config.appearance.buttons.desc} icon="🔘">
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label={t.config.appearance.buttons.padding_x}>
                            <input
                                type="number"
                                value={settings.buttonPaddingX}
                                onChange={(e) => setSettings({ ...settings, buttonPaddingX: Number(e.target.value) })}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.buttons.padding_y}>
                            <input
                                type="number"
                                value={settings.buttonPaddingY}
                                onChange={(e) => setSettings({ ...settings, buttonPaddingY: Number(e.target.value) })}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.buttons.radius}>
                            <input
                                type="number"
                                value={settings.buttonBorderRadius}
                                onChange={(e) => setSettings({ ...settings, buttonBorderRadius: Number(e.target.value) })}
                            />
                        </SettingsField>
                    </div>
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label={t.config.appearance.buttons.font_size}>
                            <input
                                type="number"
                                value={settings.buttonFontSize}
                                onChange={(e) => setSettings({ ...settings, buttonFontSize: Number(e.target.value) })}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.buttons.font_weight}>
                            <AdminDropdown
                                value={settings.buttonFontWeight.toString()}
                                onChange={(v) => setSettings({ ...settings, buttonFontWeight: Number(v) })}
                                options={[
                                    { value: '400', label: 'Normal' },
                                    { value: '500', label: 'Medium' },
                                    { value: '600', label: 'Semibold' },
                                    { value: '700', label: 'Bold' }
                                ]}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.buttons.transform}>
                            <AdminDropdown
                                value={settings.buttonTextTransform}
                                onChange={(v) => setSettings({ ...settings, buttonTextTransform: v })}
                                options={[
                                    { value: 'none', label: 'None' },
                                    { value: 'uppercase', label: 'UPPERCASE' },
                                    { value: 'capitalize', label: 'Capitalize' }
                                ]}
                            />
                        </SettingsField>
                    </div>
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label={t.config.appearance.buttons.primary_bg}>
                            <ColorPicker
                                value={settings.primaryButtonBg}
                                onChange={(color) => setSettings({ ...settings, primaryButtonBg: color })}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.buttons.primary_text}>
                            <ColorPicker
                                value={settings.primaryButtonText}
                                onChange={(color) => setSettings({ ...settings, primaryButtonText: color })}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.buttons.primary_hover}>
                            <ColorPicker
                                value={settings.primaryButtonHoverBg}
                                onChange={(color) => setSettings({ ...settings, primaryButtonHoverBg: color })}
                            />
                        </SettingsField>
                    </div>
                </SettingsSection>
            )}

            {/* Forms Tab */}
            {activeTab === 'forms' && (
                <SettingsSection title={t.config.appearance.forms.title} description={t.config.appearance.forms.desc} icon="📝">
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label={t.config.appearance.forms.input_height}>
                            <input
                                type="number"
                                value={settings.inputHeight}
                                onChange={(e) => setSettings({ ...settings, inputHeight: Number(e.target.value) })}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.forms.padding_x}>
                            <input
                                type="number"
                                value={settings.inputPaddingX}
                                onChange={(e) => setSettings({ ...settings, inputPaddingX: Number(e.target.value) })}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.forms.radius}>
                            <input
                                type="number"
                                value={settings.inputBorderRadius}
                                onChange={(e) => setSettings({ ...settings, inputBorderRadius: Number(e.target.value) })}
                            />
                        </SettingsField>
                    </div>
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label={t.config.appearance.forms.bg}>
                            <ColorPicker
                                value={settings.inputBackground}
                                onChange={(color) => setSettings({ ...settings, inputBackground: color })}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.forms.border}>
                            <ColorPicker
                                value={settings.inputBorderColor}
                                onChange={(color) => setSettings({ ...settings, inputBorderColor: color })}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.forms.focus_border}>
                            <ColorPicker
                                value={settings.inputFocusBorderColor}
                                onChange={(color) => setSettings({ ...settings, inputFocusBorderColor: color })}
                            />
                        </SettingsField>
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.appearance.forms.focus_shadow}</div>
                            <div className="settings-toggle-description">{t.config.appearance.forms.focus_shadow_desc}</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.inputFocusShadow}
                            onChange={(checked) => setSettings({ ...settings, inputFocusShadow: checked })}
                        />
                    </div>
                </SettingsSection>
            )}

            {/* Cards Tab */}
            {activeTab === 'cards' && (
                <SettingsSection title={t.config.appearance.cards.title} description={t.config.appearance.cards.desc} icon="🃏">
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label={t.config.appearance.cards.bg}>
                            <ColorPicker
                                value={settings.cardBackground}
                                onChange={(color) => setSettings({ ...settings, cardBackground: color })}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.cards.border}>
                            <ColorPicker
                                value={settings.cardBorderColor}
                                onChange={(color) => setSettings({ ...settings, cardBorderColor: color })}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.cards.radius}>
                            <input
                                type="number"
                                value={settings.cardBorderRadius}
                                onChange={(e) => setSettings({ ...settings, cardBorderRadius: Number(e.target.value) })}
                            />
                        </SettingsField>
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.appearance.cards.shadow}</div>
                            <div className="settings-toggle-description">{t.config.appearance.cards.shadow_desc}</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.cardShadow}
                            onChange={(checked) => setSettings({ ...settings, cardShadow: checked })}
                        />
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.appearance.cards.hover_shadow}</div>
                            <div className="settings-toggle-description">{t.config.appearance.cards.hover_shadow_desc}</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.cardHoverShadow}
                            onChange={(checked) => setSettings({ ...settings, cardHoverShadow: checked })}
                        />
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.appearance.cards.hover_transform}</div>
                            <div className="settings-toggle-description">{t.config.appearance.cards.hover_transform_desc}</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.cardHoverTransform}
                            onChange={(checked) => setSettings({ ...settings, cardHoverTransform: checked })}
                        />
                    </div>
                </SettingsSection>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
                <SettingsSection title={t.config.appearance.products.title} description={t.config.appearance.products.desc} icon="🛍️">
                    <SettingsField label={t.config.appearance.products.ratio}>
                        <AdminDropdown
                            value={settings.productCardImageRatio}
                            onChange={(v) => setSettings({ ...settings, productCardImageRatio: v })}
                            options={[
                                { value: '1/1', label: 'Square (1:1)' },
                                { value: '4/5', label: 'Portrait (4:5)' },
                                { value: '3/4', label: 'Portrait (3:4)' },
                                { value: '16/9', label: 'Landscape (16:9)' }
                            ]}
                        />
                    </SettingsField>
                    <div className="settings-grid">
                        <SettingsField label={t.config.appearance.products.price_size}>
                            <input
                                type="number"
                                value={settings.productCardPriceSize}
                                onChange={(e) => setSettings({ ...settings, productCardPriceSize: Number(e.target.value) })}
                            />
                        </SettingsField>
                        <SettingsField label={t.config.appearance.products.title_lines}>
                            <AdminDropdown
                                value={settings.productCardTitleLines.toString()}
                                onChange={(v) => setSettings({ ...settings, productCardTitleLines: Number(v) })}
                                options={[
                                    { value: '1', label: '1 Line' },
                                    { value: '2', label: '2 Lines' },
                                    { value: '3', label: '3 Lines' }
                                ]}
                            />
                        </SettingsField>
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.appearance.products.quick_view}</div>
                            <div className="settings-toggle-description">{t.config.appearance.products.quick_view_desc}</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.productCardShowQuickView}
                            onChange={(checked) => setSettings({ ...settings, productCardShowQuickView: checked })}
                        />
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.appearance.products.wishlist}</div>
                            <div className="settings-toggle-description">{t.config.appearance.products.wishlist_desc}</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.productCardShowWishlist}
                            onChange={(checked) => setSettings({ ...settings, productCardShowWishlist: checked })}
                        />
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.appearance.products.rating}</div>
                            <div className="settings-toggle-description">{t.config.appearance.products.rating_desc}</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.productCardShowRating}
                            onChange={(checked) => setSettings({ ...settings, productCardShowRating: checked })}
                        />
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.appearance.products.badges}</div>
                            <div className="settings-toggle-description">{t.config.appearance.products.badges_desc}</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.productCardShowBadges}
                            onChange={(checked) => setSettings({ ...settings, productCardShowBadges: checked })}
                        />
                    </div>
                </SettingsSection>
            )}

            {/* Custom Code Tab */}
            {activeTab === 'custom' && (
                <SettingsSection title={t.config.appearance.custom.title} description={t.config.appearance.custom.desc} icon="💻">
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">{t.config.appearance.custom.enable}</div>
                            <div className="settings-toggle-description">{t.config.appearance.custom.enable_desc}</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.customCSSEnabled}
                            onChange={(checked) => setSettings({ ...settings, customCSSEnabled: checked })}
                        />
                    </div>
                    {settings.customCSSEnabled && (
                        <>
                            <SettingsField label={t.config.appearance.custom.css_head} description="Injected in <head>">
                                <textarea
                                    value={settings.customCSSHead}
                                    onChange={(e) => setSettings({ ...settings, customCSSHead: e.target.value })}
                                    style={{ fontFamily: 'monospace', minHeight: '120px' }}
                                    placeholder="/* Your custom CSS */"
                                />
                            </SettingsField>
                            <SettingsField label={t.config.appearance.custom.css_body} description="Injected before </body>">
                                <textarea
                                    value={settings.customCSSBody}
                                    onChange={(e) => setSettings({ ...settings, customCSSBody: e.target.value })}
                                    style={{ fontFamily: 'monospace', minHeight: '120px' }}
                                    placeholder="/* Additional CSS */"
                                />
                            </SettingsField>
                            <SettingsField label={t.config.appearance.custom.js_head} description="Injected in <head>">
                                <textarea
                                    value={settings.customJSHead}
                                    onChange={(e) => setSettings({ ...settings, customJSHead: e.target.value })}
                                    style={{ fontFamily: 'monospace', minHeight: '120px' }}
                                    placeholder="// Your custom JavaScript"
                                />
                            </SettingsField>
                            <SettingsField label={t.config.appearance.custom.js_body} description="Before </body>">
                                <textarea
                                    value={settings.customJSBody}
                                    onChange={(e) => setSettings({ ...settings, customJSBody: e.target.value })}
                                    style={{ fontFamily: 'monospace', minHeight: '120px' }}
                                    placeholder="// Additional JavaScript"
                                />
                            </SettingsField>
                        </>
                    )}
                </SettingsSection>
            )}

            <div className="settings-actions">
                <button
                    className="admin-btn admin-btn-outline"
                    onClick={() => {
                        setSettings(defaultSettings);
                        toast.info(t.config.appearance.reset_confirm || 'Settings reset to default values');
                    }}
                    type="button"
                >
                    {t.config.appearance.reset}
                </button>
                <button
                    className="admin-btn admin-btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? t.config.appearance.saving : t.config.appearance.save}
                </button>
            </div>
        </div>
    );
}
