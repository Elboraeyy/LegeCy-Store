"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig, LocalizationSettings } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import { toast } from 'sonner';

const defaultSettings: LocalizationSettings = {
    defaultLanguage: 'ar',
    enableRTL: true,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: 'ar-EG',
    weightUnit: 'kg',
    dimensionUnit: 'cm',
};

const languages = [
    { value: 'ar', label: 'العربية (Arabic)' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français (French)' },
];

const dateFormats = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2025)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2025)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-12-31)' },
    { value: 'DD MMM YYYY', label: 'DD MMM YYYY (31 Dec 2025)' },
];

const numberFormats = [
    { value: 'ar-EG', label: 'Arabic (Egypt) - ١٢٣٬٤٥٦٫٧٨' },
    { value: 'en-US', label: 'English (US) - 123,456.78' },
    { value: 'en-GB', label: 'English (UK) - 123,456.78' },
    { value: 'de-DE', label: 'German - 123.456,78' },
];

export default function LocalizationSettingsPage() {
    const [settings, setSettings] = useState<LocalizationSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('localization_settings');
                if (data) setSettings(data as LocalizationSettings);
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
            await updateStoreConfig('localization_settings', settings);
            toast.success('Localization settings saved!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

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
                <h1 className="settings-page-title">Localization</h1>
                <p className="settings-page-description">
                    Configure language, date formats, and regional preferences
                </p>
            </div>

            <SettingsSection
                title="Language & Direction"
                description="Default language and text direction"
                icon="🌍"
            >
                <SettingsField
                    label="Default Language"
                    htmlFor="language"
                >
                    <select
                        id="language"
                        value={settings.defaultLanguage}
                        onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                        style={{ maxWidth: '300px' }}
                    >
                        {languages.map((lang) => (
                            <option key={lang.value} value={lang.value}>
                                {lang.label}
                            </option>
                        ))}
                    </select>
                </SettingsField>

                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Enable RTL (Right-to-Left)</div>
                        <div className="settings-toggle-description">
                            Use right-to-left text direction for Arabic and similar languages
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.enableRTL}
                        onChange={(checked) => setSettings({ ...settings, enableRTL: checked })}
                    />
                </div>
            </SettingsSection>

            <SettingsSection
                title="Date & Time"
                description="How dates and times are displayed"
                icon="📅"
            >
                <div className="settings-grid">
                    <SettingsField
                        label="Date Format"
                        htmlFor="dateFormat"
                    >
                        <select
                            id="dateFormat"
                            value={settings.dateFormat}
                            onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                        >
                            {dateFormats.map((format) => (
                                <option key={format.value} value={format.value}>
                                    {format.label}
                                </option>
                            ))}
                        </select>
                    </SettingsField>

                    <SettingsField
                        label="Time Format"
                        htmlFor="timeFormat"
                    >
                        <select
                            id="timeFormat"
                            value={settings.timeFormat}
                            onChange={(e) => setSettings({ ...settings, timeFormat: e.target.value })}
                        >
                            <option value="12h">12-hour (3:00 PM)</option>
                            <option value="24h">24-hour (15:00)</option>
                        </select>
                    </SettingsField>
                </div>
            </SettingsSection>

            <SettingsSection
                title="Numbers & Measurements"
                description="Format for numbers and units"
                icon="📏"
            >
                <SettingsField
                    label="Number Format"
                    htmlFor="numberFormat"
                >
                    <select
                        id="numberFormat"
                        value={settings.numberFormat}
                        onChange={(e) => setSettings({ ...settings, numberFormat: e.target.value })}
                        style={{ maxWidth: '350px' }}
                    >
                        {numberFormats.map((format) => (
                            <option key={format.value} value={format.value}>
                                {format.label}
                            </option>
                        ))}
                    </select>
                </SettingsField>

                <div className="settings-grid">
                    <SettingsField
                        label="Weight Unit"
                        htmlFor="weightUnit"
                    >
                        <select
                            id="weightUnit"
                            value={settings.weightUnit}
                            onChange={(e) => setSettings({ ...settings, weightUnit: e.target.value })}
                        >
                            <option value="kg">Kilograms (kg)</option>
                            <option value="g">Grams (g)</option>
                            <option value="lb">Pounds (lb)</option>
                            <option value="oz">Ounces (oz)</option>
                        </select>
                    </SettingsField>

                    <SettingsField
                        label="Dimension Unit"
                        htmlFor="dimensionUnit"
                    >
                        <select
                            id="dimensionUnit"
                            value={settings.dimensionUnit}
                            onChange={(e) => setSettings({ ...settings, dimensionUnit: e.target.value })}
                        >
                            <option value="cm">Centimeters (cm)</option>
                            <option value="m">Meters (m)</option>
                            <option value="in">Inches (in)</option>
                            <option value="ft">Feet (ft)</option>
                        </select>
                    </SettingsField>
                </div>
            </SettingsSection>

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
