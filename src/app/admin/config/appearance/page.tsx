"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ColorPicker from '@/components/admin/settings/ColorPicker';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import { toast } from 'sonner';

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
    secondaryColor: '#e8e6e1',
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
    secondaryButtonBg: '#e8e6e1',
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
            toast.success('Appearance settings saved!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'colors', label: 'Colors', icon: '🎨' },
        { id: 'typography', label: 'Typography', icon: '✍️' },
        { id: 'layout', label: 'Layout', icon: '📐' },
        { id: 'effects', label: 'Effects', icon: '✨' },
        { id: 'darkmode', label: 'Dark Mode', icon: '🌙' },
        { id: 'header', label: 'Header', icon: '🔝' },
        { id: 'footer', label: 'Footer', icon: '🔻' },
        { id: 'buttons', label: 'Buttons', icon: '🔘' },
        { id: 'forms', label: 'Forms', icon: '📝' },
        { id: 'cards', label: 'Cards', icon: '🃏' },
        { id: 'products', label: 'Products', icon: '🛍️' },
        { id: 'custom', label: 'Custom Code', icon: '💻' },
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
                <h1 className="settings-page-title">Appearance</h1>
                <p className="settings-page-description">
                    Complete visual customization with 120+ design options
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
                    <SettingsSection title="Theme Colors" description="Primary brand colors" icon="🎨">
                        <div className="settings-grid settings-grid-3">
                            <SettingsField label="Primary Color">
                                <ColorPicker
                                    value={settings.primaryColor}
                                    onChange={(color) => setSettings({ ...settings, primaryColor: color })}
                                />
                            </SettingsField>
                            <SettingsField label="Primary Light">
                                <ColorPicker
                                    value={settings.primaryColorLight}
                                    onChange={(color) => setSettings({ ...settings, primaryColorLight: color })}
                                />
                            </SettingsField>
                            <SettingsField label="Primary Dark">
                                <ColorPicker
                                    value={settings.primaryColorDark}
                                    onChange={(color) => setSettings({ ...settings, primaryColorDark: color })}
                                />
                            </SettingsField>
                        </div>
                        <div className="settings-grid settings-grid-3">
                            <SettingsField label="Secondary Color">
                                <ColorPicker
                                    value={settings.secondaryColor}
                                    onChange={(color) => setSettings({ ...settings, secondaryColor: color })}
                                />
                            </SettingsField>
                            <SettingsField label="Accent Color">
                                <ColorPicker
                                    value={settings.accentColor}
                                    onChange={(color) => setSettings({ ...settings, accentColor: color })}
                                />
                            </SettingsField>
                            <SettingsField label="Accent Hover">
                                <ColorPicker
                                    value={settings.accentColorHover}
                                    onChange={(color) => setSettings({ ...settings, accentColorHover: color })}
                                />
                            </SettingsField>
                        </div>
                    </SettingsSection>

                    <SettingsSection title="Background & Surface" description="Page and component backgrounds" icon="📄">
                        <div className="settings-grid settings-grid-3">
                            <SettingsField label="Background Color">
                                <ColorPicker
                                    value={settings.backgroundColor}
                                    onChange={(color) => setSettings({ ...settings, backgroundColor: color })}
                                />
                            </SettingsField>
                            <SettingsField label="Surface Color">
                                <ColorPicker
                                    value={settings.surfaceColor}
                                    onChange={(color) => setSettings({ ...settings, surfaceColor: color })}
                                />
                            </SettingsField>
                            <SettingsField label="Border Color">
                                <ColorPicker
                                    value={settings.borderColor}
                                    onChange={(color) => setSettings({ ...settings, borderColor: color })}
                                />
                            </SettingsField>
                        </div>
                    </SettingsSection>

                    <SettingsSection title="Text Colors" description="Typography colors" icon="🔤">
                        <div className="settings-grid settings-grid-3">
                            <SettingsField label="Text Primary">
                                <ColorPicker
                                    value={settings.textPrimary}
                                    onChange={(color) => setSettings({ ...settings, textPrimary: color })}
                                />
                            </SettingsField>
                            <SettingsField label="Text Secondary">
                                <ColorPicker
                                    value={settings.textSecondary}
                                    onChange={(color) => setSettings({ ...settings, textSecondary: color })}
                                />
                            </SettingsField>
                            <SettingsField label="Text Muted">
                                <ColorPicker
                                    value={settings.textMuted}
                                    onChange={(color) => setSettings({ ...settings, textMuted: color })}
                                />
                            </SettingsField>
                        </div>
                        <div className="settings-grid">
                            <SettingsField label="Link Color">
                                <ColorPicker
                                    value={settings.linkColor}
                                    onChange={(color) => setSettings({ ...settings, linkColor: color })}
                                />
                            </SettingsField>
                            <SettingsField label="Link Hover Color">
                                <ColorPicker
                                    value={settings.linkHoverColor}
                                    onChange={(color) => setSettings({ ...settings, linkHoverColor: color })}
                                />
                            </SettingsField>
                        </div>
                    </SettingsSection>

                    <SettingsSection title="Status Colors" description="Feedback and status indicators" icon="🚦">
                        <div className="settings-grid settings-grid-3">
                            <SettingsField label="Success">
                                <ColorPicker
                                    value={settings.successColor}
                                    onChange={(color) => setSettings({ ...settings, successColor: color })}
                                />
                            </SettingsField>
                            <SettingsField label="Warning">
                                <ColorPicker
                                    value={settings.warningColor}
                                    onChange={(color) => setSettings({ ...settings, warningColor: color })}
                                />
                            </SettingsField>
                            <SettingsField label="Error">
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
                <SettingsSection title="Typography Settings" description="Fonts and text styling" icon="✍️">
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label="Heading Font">
                            <select
                                value={settings.fontFamilyHeading}
                                onChange={(e) => setSettings({ ...settings, fontFamilyHeading: e.target.value })}
                            >
                                {fontOptions.map((font) => (
                                    <option key={font.value} value={font.value}>{font.label}</option>
                                ))}
                            </select>
                        </SettingsField>
                        <SettingsField label="Body Font">
                            <select
                                value={settings.fontFamilyBody}
                                onChange={(e) => setSettings({ ...settings, fontFamilyBody: e.target.value })}
                            >
                                {fontOptions.map((font) => (
                                    <option key={font.value} value={font.value}>{font.label}</option>
                                ))}
                            </select>
                        </SettingsField>
                        <SettingsField label="Monospace Font">
                            <select
                                value={settings.fontFamilyMono}
                                onChange={(e) => setSettings({ ...settings, fontFamilyMono: e.target.value })}
                            >
                                <option value="JetBrains Mono">JetBrains Mono</option>
                                <option value="Fira Code">Fira Code</option>
                                <option value="Source Code Pro">Source Code Pro</option>
                                <option value="Roboto Mono">Roboto Mono</option>
                            </select>
                        </SettingsField>
                    </div>
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label="Base Font Size (px)">
                            <input
                                type="number"
                                value={settings.baseFontSize}
                                onChange={(e) => setSettings({ ...settings, baseFontSize: Number(e.target.value) })}
                                min={12}
                                max={24}
                            />
                        </SettingsField>
                        <SettingsField label="Heading Weight">
                            <select
                                value={settings.headingFontWeight}
                                onChange={(e) => setSettings({ ...settings, headingFontWeight: Number(e.target.value) })}
                            >
                                <option value={400}>Normal (400)</option>
                                <option value={500}>Medium (500)</option>
                                <option value={600}>Semibold (600)</option>
                                <option value={700}>Bold (700)</option>
                                <option value={800}>Extra Bold (800)</option>
                            </select>
                        </SettingsField>
                        <SettingsField label="Body Weight">
                            <select
                                value={settings.bodyFontWeight}
                                onChange={(e) => setSettings({ ...settings, bodyFontWeight: Number(e.target.value) })}
                            >
                                <option value={300}>Light (300)</option>
                                <option value={400}>Normal (400)</option>
                                <option value={500}>Medium (500)</option>
                            </select>
                        </SettingsField>
                    </div>
                    <div className="settings-grid">
                        <SettingsField label="Line Height">
                            <select
                                value={settings.lineHeightBase}
                                onChange={(e) => setSettings({ ...settings, lineHeightBase: Number(e.target.value) })}
                            >
                                <option value={1.4}>Tight (1.4)</option>
                                <option value={1.5}>Normal (1.5)</option>
                                <option value={1.6}>Comfortable (1.6)</option>
                                <option value={1.8}>Relaxed (1.8)</option>
                            </select>
                        </SettingsField>
                        <SettingsField label="Letter Spacing">
                            <select
                                value={settings.letterSpacing}
                                onChange={(e) => setSettings({ ...settings, letterSpacing: e.target.value })}
                            >
                                <option value="-0.02em">Tight</option>
                                <option value="normal">Normal</option>
                                <option value="0.02em">Wide</option>
                                <option value="0.05em">Extra Wide</option>
                            </select>
                        </SettingsField>
                    </div>
                </SettingsSection>
            )}

            {/* Layout Tab */}
            {activeTab === 'layout' && (
                <>
                    <SettingsSection title="Spacing" description="Margins and paddings" icon="📐">
                        <div className="settings-grid settings-grid-3">
                            <SettingsField label="Spacing Unit (px)">
                                <input
                                    type="number"
                                    value={settings.spacingUnit}
                                    onChange={(e) => setSettings({ ...settings, spacingUnit: Number(e.target.value) })}
                                    min={4}
                                    max={16}
                                />
                            </SettingsField>
                            <SettingsField label="Container Max Width (px)">
                                <input
                                    type="number"
                                    value={settings.containerMaxWidth}
                                    onChange={(e) => setSettings({ ...settings, containerMaxWidth: Number(e.target.value) })}
                                    min={1000}
                                    max={2000}
                                />
                            </SettingsField>
                            <SettingsField label="Section Padding Y (px)">
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

                    <SettingsSection title="Borders & Corners" description="Shape and borders" icon="⬡">
                        <div className="settings-grid settings-grid-3">
                            <SettingsField label="Border Radius (px)">
                                <input
                                    type="number"
                                    value={settings.borderRadius}
                                    onChange={(e) => setSettings({ ...settings, borderRadius: Number(e.target.value) })}
                                    min={0}
                                    max={50}
                                />
                            </SettingsField>
                            <SettingsField label="Small Radius (px)">
                                <input
                                    type="number"
                                    value={settings.borderRadiusSmall}
                                    onChange={(e) => setSettings({ ...settings, borderRadiusSmall: Number(e.target.value) })}
                                    min={0}
                                    max={30}
                                />
                            </SettingsField>
                            <SettingsField label="Large Radius (px)">
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
                            <SettingsField label="Border Width (px)">
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
                                <div className="settings-toggle-label">Pill Buttons</div>
                                <div className="settings-toggle-description">Use fully rounded (pill) buttons</div>
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
                    <SettingsSection title="Shadows" description="Box shadows for depth" icon="🌑">
                        <div className="settings-toggle-row">
                            <div className="settings-toggle-info">
                                <div className="settings-toggle-label">Enable Shadows</div>
                                <div className="settings-toggle-description">Add depth with box shadows</div>
                            </div>
                            <ToggleSwitch
                                checked={settings.shadowsEnabled}
                                onChange={(checked) => setSettings({ ...settings, shadowsEnabled: checked })}
                            />
                        </div>
                        {settings.shadowsEnabled && (
                            <>
                                <SettingsField label="Small Shadow">
                                    <input
                                        type="text"
                                        value={settings.shadowSmall}
                                        onChange={(e) => setSettings({ ...settings, shadowSmall: e.target.value })}
                                    />
                                </SettingsField>
                                <SettingsField label="Medium Shadow">
                                    <input
                                        type="text"
                                        value={settings.shadowMedium}
                                        onChange={(e) => setSettings({ ...settings, shadowMedium: e.target.value })}
                                    />
                                </SettingsField>
                                <SettingsField label="Large Shadow">
                                    <input
                                        type="text"
                                        value={settings.shadowLarge}
                                        onChange={(e) => setSettings({ ...settings, shadowLarge: e.target.value })}
                                    />
                                </SettingsField>
                            </>
                        )}
                    </SettingsSection>

                    <SettingsSection title="Animations" description="Motion and transitions" icon="✨">
                        <div className="settings-toggle-row">
                            <div className="settings-toggle-info">
                                <div className="settings-toggle-label">Enable Animations</div>
                                <div className="settings-toggle-description">Smooth transitions and motion</div>
                            </div>
                            <ToggleSwitch
                                checked={settings.animationsEnabled}
                                onChange={(checked) => setSettings({ ...settings, animationsEnabled: checked })}
                            />
                        </div>
                        {settings.animationsEnabled && (
                            <>
                                <div className="settings-grid">
                                    <SettingsField label="Duration (ms)">
                                        <input
                                            type="number"
                                            value={settings.animationDuration}
                                            onChange={(e) => setSettings({ ...settings, animationDuration: Number(e.target.value) })}
                                            min={100}
                                            max={1000}
                                        />
                                    </SettingsField>
                                    <SettingsField label="Easing">
                                        <select
                                            value={settings.animationEasing}
                                            onChange={(e) => setSettings({ ...settings, animationEasing: e.target.value })}
                                        >
                                            <option value="ease">Ease</option>
                                            <option value="ease-in">Ease In</option>
                                            <option value="ease-out">Ease Out</option>
                                            <option value="ease-in-out">Ease In Out</option>
                                            <option value="linear">Linear</option>
                                        </select>
                                    </SettingsField>
                                </div>
                                <div className="settings-toggle-row">
                                    <div className="settings-toggle-info">
                                        <div className="settings-toggle-label">Hover Effects</div>
                                        <div className="settings-toggle-description">Scale and lift effects on hover</div>
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
                                    <div className="settings-toggle-label">Dark Mode by Default</div>
                                    <div className="settings-toggle-description">Start with dark theme enabled</div>
                                </div>
                                <ToggleSwitch
                                    checked={settings.darkModeDefault}
                                    onChange={(checked) => setSettings({ ...settings, darkModeDefault: checked })}
                                />
                            </div>
                            <div className="settings-toggle-row">
                                <div className="settings-toggle-info">
                                    <div className="settings-toggle-label">Scheduled Dark Mode</div>
                                    <div className="settings-toggle-description">Auto-enable based on time</div>
                                </div>
                                <ToggleSwitch
                                    checked={settings.darkModeScheduled}
                                    onChange={(checked) => setSettings({ ...settings, darkModeScheduled: checked })}
                                />
                            </div>
                            {settings.darkModeScheduled && (
                                <div className="settings-grid">
                                    <SettingsField label="Start Time">
                                        <input
                                            type="time"
                                            value={settings.darkModeStartTime}
                                            onChange={(e) => setSettings({ ...settings, darkModeStartTime: e.target.value })}
                                        />
                                    </SettingsField>
                                    <SettingsField label="End Time">
                                        <input
                                            type="time"
                                            value={settings.darkModeEndTime}
                                            onChange={(e) => setSettings({ ...settings, darkModeEndTime: e.target.value })}
                                        />
                                    </SettingsField>
                                </div>
                            )}
                            <div style={{ marginTop: '20px' }}>
                                <h4 style={{ marginBottom: '16px', fontWeight: 600 }}>Dark Theme Colors</h4>
                                <div className="settings-grid settings-grid-3">
                                    <SettingsField label="Background">
                                        <ColorPicker
                                            value={settings.darkBackgroundColor}
                                            onChange={(color) => setSettings({ ...settings, darkBackgroundColor: color })}
                                        />
                                    </SettingsField>
                                    <SettingsField label="Surface">
                                        <ColorPicker
                                            value={settings.darkSurfaceColor}
                                            onChange={(color) => setSettings({ ...settings, darkSurfaceColor: color })}
                                        />
                                    </SettingsField>
                                    <SettingsField label="Border">
                                        <ColorPicker
                                            value={settings.darkBorderColor}
                                            onChange={(color) => setSettings({ ...settings, darkBorderColor: color })}
                                        />
                                    </SettingsField>
                                </div>
                                <div className="settings-grid">
                                    <SettingsField label="Text Primary">
                                        <ColorPicker
                                            value={settings.darkTextPrimary}
                                            onChange={(color) => setSettings({ ...settings, darkTextPrimary: color })}
                                        />
                                    </SettingsField>
                                    <SettingsField label="Text Secondary">
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
                <SettingsSection title="Header Settings" description="Site header configuration" icon="🔝">
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label="Header Height (px)">
                            <input
                                type="number"
                                value={settings.headerHeight}
                                onChange={(e) => setSettings({ ...settings, headerHeight: Number(e.target.value) })}
                                min={50}
                                max={150}
                            />
                        </SettingsField>
                        <SettingsField label="Logo Max Height (px)">
                            <input
                                type="number"
                                value={settings.headerLogoMaxHeight}
                                onChange={(e) => setSettings({ ...settings, headerLogoMaxHeight: Number(e.target.value) })}
                                min={20}
                                max={100}
                            />
                        </SettingsField>
                        <SettingsField label="Header Background">
                            <ColorPicker
                                value={settings.headerBackground}
                                onChange={(color) => setSettings({ ...settings, headerBackground: color })}
                            />
                        </SettingsField>
                    </div>
                    <SettingsField label="Header Text Color">
                        <ColorPicker
                            value={settings.headerTextColor}
                            onChange={(color) => setSettings({ ...settings, headerTextColor: color })}
                        />
                    </SettingsField>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Sticky Header</div>
                            <div className="settings-toggle-description">Keep header visible on scroll</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.headerSticky}
                            onChange={(checked) => setSettings({ ...settings, headerSticky: checked })}
                        />
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Header Shadow</div>
                            <div className="settings-toggle-description">Add shadow below header</div>
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
                <SettingsSection title="Footer Settings" description="Site footer configuration" icon="🔻">
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label="Footer Background">
                            <ColorPicker
                                value={settings.footerBackground}
                                onChange={(color) => setSettings({ ...settings, footerBackground: color })}
                            />
                        </SettingsField>
                        <SettingsField label="Footer Text Color">
                            <ColorPicker
                                value={settings.footerTextColor}
                                onChange={(color) => setSettings({ ...settings, footerTextColor: color })}
                            />
                        </SettingsField>
                        <SettingsField label="Link Color">
                            <ColorPicker
                                value={settings.footerLinkColor}
                                onChange={(color) => setSettings({ ...settings, footerLinkColor: color })}
                            />
                        </SettingsField>
                    </div>
                    <SettingsField label="Footer Columns">
                        <select
                            value={settings.footerColumns}
                            onChange={(e) => setSettings({ ...settings, footerColumns: Number(e.target.value) })}
                            style={{ maxWidth: '200px' }}
                        >
                            <option value={2}>2 Columns</option>
                            <option value={3}>3 Columns</option>
                            <option value={4}>4 Columns</option>
                            <option value={5}>5 Columns</option>
                        </select>
                    </SettingsField>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Show Newsletter</div>
                            <div className="settings-toggle-description">Email subscription form in footer</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.footerShowNewsletter}
                            onChange={(checked) => setSettings({ ...settings, footerShowNewsletter: checked })}
                        />
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Show Social Icons</div>
                            <div className="settings-toggle-description">Social media icons in footer</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.footerShowSocial}
                            onChange={(checked) => setSettings({ ...settings, footerShowSocial: checked })}
                        />
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Show Payment Icons</div>
                            <div className="settings-toggle-description">Payment method icons</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.footerShowPaymentIcons}
                            onChange={(checked) => setSettings({ ...settings, footerShowPaymentIcons: checked })}
                        />
                    </div>
                    <SettingsField label="Copyright Text">
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
                <SettingsSection title="Button Styles" description="Button appearance" icon="🔘">
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label="Padding X (px)">
                            <input
                                type="number"
                                value={settings.buttonPaddingX}
                                onChange={(e) => setSettings({ ...settings, buttonPaddingX: Number(e.target.value) })}
                            />
                        </SettingsField>
                        <SettingsField label="Padding Y (px)">
                            <input
                                type="number"
                                value={settings.buttonPaddingY}
                                onChange={(e) => setSettings({ ...settings, buttonPaddingY: Number(e.target.value) })}
                            />
                        </SettingsField>
                        <SettingsField label="Border Radius (px)">
                            <input
                                type="number"
                                value={settings.buttonBorderRadius}
                                onChange={(e) => setSettings({ ...settings, buttonBorderRadius: Number(e.target.value) })}
                            />
                        </SettingsField>
                    </div>
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label="Font Size (px)">
                            <input
                                type="number"
                                value={settings.buttonFontSize}
                                onChange={(e) => setSettings({ ...settings, buttonFontSize: Number(e.target.value) })}
                            />
                        </SettingsField>
                        <SettingsField label="Font Weight">
                            <select
                                value={settings.buttonFontWeight}
                                onChange={(e) => setSettings({ ...settings, buttonFontWeight: Number(e.target.value) })}
                            >
                                <option value={400}>Normal</option>
                                <option value={500}>Medium</option>
                                <option value={600}>Semibold</option>
                                <option value={700}>Bold</option>
                            </select>
                        </SettingsField>
                        <SettingsField label="Text Transform">
                            <select
                                value={settings.buttonTextTransform}
                                onChange={(e) => setSettings({ ...settings, buttonTextTransform: e.target.value })}
                            >
                                <option value="none">None</option>
                                <option value="uppercase">UPPERCASE</option>
                                <option value="capitalize">Capitalize</option>
                            </select>
                        </SettingsField>
                    </div>
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label="Primary BG">
                            <ColorPicker
                                value={settings.primaryButtonBg}
                                onChange={(color) => setSettings({ ...settings, primaryButtonBg: color })}
                            />
                        </SettingsField>
                        <SettingsField label="Primary Text">
                            <ColorPicker
                                value={settings.primaryButtonText}
                                onChange={(color) => setSettings({ ...settings, primaryButtonText: color })}
                            />
                        </SettingsField>
                        <SettingsField label="Primary Hover">
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
                <SettingsSection title="Form Styles" description="Input and form appearance" icon="📝">
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label="Input Height (px)">
                            <input
                                type="number"
                                value={settings.inputHeight}
                                onChange={(e) => setSettings({ ...settings, inputHeight: Number(e.target.value) })}
                            />
                        </SettingsField>
                        <SettingsField label="Padding X (px)">
                            <input
                                type="number"
                                value={settings.inputPaddingX}
                                onChange={(e) => setSettings({ ...settings, inputPaddingX: Number(e.target.value) })}
                            />
                        </SettingsField>
                        <SettingsField label="Border Radius (px)">
                            <input
                                type="number"
                                value={settings.inputBorderRadius}
                                onChange={(e) => setSettings({ ...settings, inputBorderRadius: Number(e.target.value) })}
                            />
                        </SettingsField>
                    </div>
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label="Background">
                            <ColorPicker
                                value={settings.inputBackground}
                                onChange={(color) => setSettings({ ...settings, inputBackground: color })}
                            />
                        </SettingsField>
                        <SettingsField label="Border Color">
                            <ColorPicker
                                value={settings.inputBorderColor}
                                onChange={(color) => setSettings({ ...settings, inputBorderColor: color })}
                            />
                        </SettingsField>
                        <SettingsField label="Focus Border">
                            <ColorPicker
                                value={settings.inputFocusBorderColor}
                                onChange={(color) => setSettings({ ...settings, inputFocusBorderColor: color })}
                            />
                        </SettingsField>
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Focus Shadow</div>
                            <div className="settings-toggle-description">Glow effect on focus</div>
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
                <SettingsSection title="Card Styles" description="Card component appearance" icon="🃏">
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label="Background">
                            <ColorPicker
                                value={settings.cardBackground}
                                onChange={(color) => setSettings({ ...settings, cardBackground: color })}
                            />
                        </SettingsField>
                        <SettingsField label="Border Color">
                            <ColorPicker
                                value={settings.cardBorderColor}
                                onChange={(color) => setSettings({ ...settings, cardBorderColor: color })}
                            />
                        </SettingsField>
                        <SettingsField label="Border Radius (px)">
                            <input
                                type="number"
                                value={settings.cardBorderRadius}
                                onChange={(e) => setSettings({ ...settings, cardBorderRadius: Number(e.target.value) })}
                            />
                        </SettingsField>
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Card Shadow</div>
                            <div className="settings-toggle-description">Default shadow on cards</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.cardShadow}
                            onChange={(checked) => setSettings({ ...settings, cardShadow: checked })}
                        />
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Hover Shadow</div>
                            <div className="settings-toggle-description">Enhanced shadow on hover</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.cardHoverShadow}
                            onChange={(checked) => setSettings({ ...settings, cardHoverShadow: checked })}
                        />
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Hover Transform</div>
                            <div className="settings-toggle-description">Lift effect on hover</div>
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
                <SettingsSection title="Product Card Settings" description="How products appear" icon="🛍️">
                    <SettingsField label="Image Aspect Ratio">
                        <select
                            value={settings.productCardImageRatio}
                            onChange={(e) => setSettings({ ...settings, productCardImageRatio: e.target.value })}
                            style={{ maxWidth: '200px' }}
                        >
                            <option value="1/1">Square (1:1)</option>
                            <option value="4/5">Portrait (4:5)</option>
                            <option value="3/4">Portrait (3:4)</option>
                            <option value="16/9">Landscape (16:9)</option>
                        </select>
                    </SettingsField>
                    <div className="settings-grid">
                        <SettingsField label="Price Font Size (px)">
                            <input
                                type="number"
                                value={settings.productCardPriceSize}
                                onChange={(e) => setSettings({ ...settings, productCardPriceSize: Number(e.target.value) })}
                            />
                        </SettingsField>
                        <SettingsField label="Title Max Lines">
                            <select
                                value={settings.productCardTitleLines}
                                onChange={(e) => setSettings({ ...settings, productCardTitleLines: Number(e.target.value) })}
                            >
                                <option value={1}>1 Line</option>
                                <option value={2}>2 Lines</option>
                                <option value={3}>3 Lines</option>
                            </select>
                        </SettingsField>
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Show Quick View</div>
                            <div className="settings-toggle-description">Quick view button on hover</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.productCardShowQuickView}
                            onChange={(checked) => setSettings({ ...settings, productCardShowQuickView: checked })}
                        />
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Show Wishlist</div>
                            <div className="settings-toggle-description">Wishlist heart icon</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.productCardShowWishlist}
                            onChange={(checked) => setSettings({ ...settings, productCardShowWishlist: checked })}
                        />
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Show Rating</div>
                            <div className="settings-toggle-description">Star rating display</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.productCardShowRating}
                            onChange={(checked) => setSettings({ ...settings, productCardShowRating: checked })}
                        />
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Show Badges</div>
                            <div className="settings-toggle-description">Sale, New, etc. badges</div>
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
                <SettingsSection title="Custom Code" description="Add custom CSS and JavaScript" icon="💻">
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <div className="settings-toggle-label">Enable Custom Code</div>
                            <div className="settings-toggle-description">Inject custom CSS and JS</div>
                        </div>
                        <ToggleSwitch
                            checked={settings.customCSSEnabled}
                            onChange={(checked) => setSettings({ ...settings, customCSSEnabled: checked })}
                        />
                    </div>
                    {settings.customCSSEnabled && (
                        <>
                            <SettingsField label="Custom CSS (Head)" description="Injected in <head>">
                                <textarea
                                    value={settings.customCSSHead}
                                    onChange={(e) => setSettings({ ...settings, customCSSHead: e.target.value })}
                                    style={{ fontFamily: 'monospace', minHeight: '120px' }}
                                    placeholder="/* Your custom CSS */"
                                />
                            </SettingsField>
                            <SettingsField label="Custom CSS (Body)" description="Injected before </body>">
                                <textarea
                                    value={settings.customCSSBody}
                                    onChange={(e) => setSettings({ ...settings, customCSSBody: e.target.value })}
                                    style={{ fontFamily: 'monospace', minHeight: '120px' }}
                                    placeholder="/* Additional CSS */"
                                />
                            </SettingsField>
                            <SettingsField label="Custom JavaScript (Head)" description="Injected in <head>">
                                <textarea
                                    value={settings.customJSHead}
                                    onChange={(e) => setSettings({ ...settings, customJSHead: e.target.value })}
                                    style={{ fontFamily: 'monospace', minHeight: '120px' }}
                                    placeholder="// Your custom JavaScript"
                                />
                            </SettingsField>
                            <SettingsField label="Custom JavaScript (Body)" description="Before </body>">
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
